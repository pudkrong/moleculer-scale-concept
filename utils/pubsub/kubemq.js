const Base = require('./base');
const { EventsClient, Utils: KubeUtils } = require('kubemq-js');
const crypto = require('crypto');

class Kubemq extends Base {
  constructor (options) {
    super(options);

    this.clientId = this.options.clientId || `${crypto.randomBytes(8).toString('hex')}-Emitter`;
    this.logger = this.options.logger;
    this.init();
  }

  init () {
    this.client = new EventsClient({
      clientId: this.clientId
    });
  }

  async publish (topic, payload, meta = {}) {
    return this.client.send({
      channel: topic,
      body: KubeUtils.stringToBytes(JSON.stringify(payload)),
      metadata: JSON.stringify(meta)
    });
  }

  async _resubscribe () {
    const { topic, handler, options } = this.__save;

    if (topic) {
      await new Promise(r => setTimeout(r, 2000));

      this.init();
      await this.subscribe(topic, handler, options);
    }
  }

  async subscribe (topic, handler, options = {}) {
    const self = this;

    this.__save = { topic, handler, options };
    return this.client.subscribe({
      channel: topic,
      group: options.group || ''
    }, async (error, msg) => {
      if (error) {
        // Connection dropped
        this.logger.error('KubeMQ:: connection error', error);
        self._resubscribe();
      } else {
        const payload = JSON.parse(KubeUtils.bytesToString(msg.body));
        const meta = JSON.parse(msg.metadata || {});
        await handler(payload, meta);
      }
    });
  }
}

module.exports = Kubemq;
