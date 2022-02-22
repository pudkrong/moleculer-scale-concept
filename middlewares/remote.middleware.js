const Axios = require('axios');
const Policy = require('../utils/policy');
const { EventsClient, Utils: KubeUtils } = require('kubemq-js');
const _ = require('lodash');
const TOPIC = 'events';

const timeout = Policy.timeout(3000);
const retry = Policy.retry(2);
const axiosMap = new Map();
const axiosByService = (service, namespace) => {
  let instance = axiosMap.get(service);
  if (!instance) {
    console.log(`Create axios for ${service}`);
    // TONOTE::PUD To make each service has their own circuit breaker, we have to create new one
    const circuitBreaker = Policy.circuitBreaker(5 * 1000, { type: 'consecutive', options: { threshold: 3 } });
    const axiosInstance = Axios.create({
      headers: { 'x-origin':  namespace }
    });
    // TONOTE::PUD to debug AXIOS
    // axiosInstance.interceptors.request.use(request => {
    //   console.log('Starting Request', JSON.stringify(request, null, 2));
    //   return request;
    // });
    instance = Policy.polify(axiosInstance, circuitBreaker, retry, timeout);
    axiosMap.set(service, instance);
  }

  return instance;
};

function wrapCallHandler (next) {
  return function (action, params, opts) {
    // By pass internal action
    if (/^\$/.test(action)) return next(action, params, opts);

    // Looking for local action first
    const ep = this.registry.getActionEndpoints(action);
    if (ep) {
      return next(action, params, opts);
    } else {
      const matches = /(?:v\d+\.)?([^\.]+)\.(.+)/.exec(action);
      const serviceName = matches ? matches[1] : 'unknown';
      // TODO::PUD At the 1st stage we will use convention for service name
      // const url = `http://${serviceName}.api.127.0.0.1.nip.io:3000`;
      const url = `http://localhost:3000`;
      const axios = axiosByService(serviceName, this.namespace);
      return axios({
        url,
        headers: { 'x-destination': serviceName },
        method: 'post',
        data: { action, params }
      })
      // return Axios.post('https://postman-echo.com/post', { action, params })
        .then(res => {
          // throw new MoleculerServerError('Service is unavilable', 500, 'SERVICE_NOT_AVAILABLE');

          return res.data;
        });
    }
  };
}

function wrapEmitHandler (next) {
  const client = new EventsClient({
    clientId: `${this.nodeID}-Emitter`
  });
  return async function (eventName, payload, opts) {
    // TONOTE::PUD this == ServiceBroker
    // console.log('EMIT:: The "emit" is called.', eventName, payload, opts);
    if (_.get(opts, 'namespace', null) !== this.namespace) {
      await client.send({
        channel: TOPIC,
        body: KubeUtils.stringToBytes(JSON.stringify({ eventName, payload, opts })),
        metadata: JSON.stringify({ sender: this.nodeID, namespace: this.namespace, braodcast: false })
      });
    }
    return next(eventName, payload, opts);
  };
}

function wrapBroadcastHandler (next) {
  const client = new EventsClient({
    clientId: `${this.nodeID}-Broadcaster`
  });
  return async function (eventName, payload, opts) {
    // TONOTE::PUD this == ServiceBroker
    // console.log('BROADCAST:: The "broadcast" is called.', eventName);
    if (_.get(opts, 'namespace', null) !== this.namespace) {
      await client.send({
        channel: TOPIC,
        body: KubeUtils.stringToBytes(JSON.stringify({ eventName, payload, opts })),
        metadata: JSON.stringify({ sender: this.nodeID, namespace: this.namespace, broadcast: true })
      });
    }
    return next(eventName, payload, opts);
  };
}

async function wrapBrokerStart (broker) {
  console.log(`Broker started as ${broker.nodeID}[${broker.namespace}]`);

  async function subscribe () {
    const client = new EventsClient({
      clientId: broker.nodeID
    });

    await client.subscribe({
      channel: TOPIC,
      group: broker.namespace || ''
    }, (err, msg) => {
      if (err) {
        // Connection dropped
        console.log('Error: ', err);
        client.close();
        setTimeout(subscribe, 2000);
      } else {
        const payload = JSON.parse(KubeUtils.bytesToString(msg.body));
        const metadata = JSON.parse(msg.metadata || {});
        // console.log('Payload', payload, metadata);
        const broadcast = _.get(metadata, 'broadcast', false);
        if (_.get(metadata, 'namespace', null) !== broker.namespace) {
          if (broadcast) {
            broker.broadcast(payload.eventName, payload.payload, Object.assign(payload.opts || {}, { namespace: broker.namespace }));
          } else {
            broker.emit(payload.eventName, payload.payload, Object.assign(payload.opts || {}, { namespace: broker.namespace }));
          }
        }
      }
    });
  }

  await subscribe();
}

module.exports = {
  name: 'remote',

  call: wrapCallHandler,
  emit: wrapEmitHandler,
  started: wrapBrokerStart,
  broadcast: wrapBroadcastHandler,
  // transitPublish: wrapTransitPublish,
  // transitMessageHandler: wrapTransitMessageHandler
};
