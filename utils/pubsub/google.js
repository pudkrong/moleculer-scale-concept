const Base = require('./base');
const { PubSub } = require('@google-cloud/pubsub');
const _ = require('lodash');

class GooglePubSub extends Base {
  constructor (options) {
    super(Object.assign(options, {
      messageRetentionDuration: {
        seconds: 86400
      }
    }));

    this.logger = this.options.logger;
    this.topics = new Map();
    this.subscriptions = new Map();
    this.init();
  }

  async init () {
    this.client = new PubSub({
      keyFilename: this.options.credential
    });
  }

  async __getTopic (topic) {
    // TONOTE::PUD Get from cache
    let gTopic = this.topics.get(topic);
    if (!gTopic) {
      // TONOTE::PUD Get from google
      gTopic = this.client.topic(topic);
      const [ exists ] = await gTopic.exists();
      if (!exists) {
        await this.__createTopic(topic).catch((error) => {
          // TONOTE::PUD in case concurrently create the same topic
          if (error.code === 6) {
            this.logger.info(`GooglePubSub: Topic ${topic} is already created, ignore...`);
          } else {
            throw error;
          }
        });
      }
      this.topics.set(topic, gTopic);
    }

    return gTopic;
  }

  async __createTopic (topic) {
    this.logger.info(`GooglePubSub:: Create topic ${topic}`);
    return this.client.createTopic({
      name: topic,
      messageRetentionDuration: this.options.messageRetentionDuration
    });
  }

  async publish (topic, payload, meta = {}) {
    const gTopic = await this.__getTopic(topic);
    return gTopic.publish(Buffer.from(JSON.stringify(payload)), { meta: JSON.stringify(meta) });
  }

  async __getSubscription (topic, name) {
    // TONOTE::PUD Get from cache
    let gSubscription = this.subscriptions.get(name);
    if (!gSubscription) {
      const gTopic = await this.__getTopic(topic);

      // TONOTE::PUD Get from google
      gSubscription = gTopic.subscription(name);
      const [ exists ] = await gSubscription.exists();
      if (!exists) {
        await this.__createSubscription(gTopic, name).catch((error) => {
          // TONOTE::PUD in case concurrently create the same topic
          if (error.code === 6) {
            this.logger.info(`GooglePubSub: Subscription ${name} is already created, ignore...`);
          } else {
            throw error;
          }
        });
      }
      this.subscriptions.set(name, gSubscription);
    }

    return gSubscription;
  }

  async __createSubscription (gTopic, name) {
    this.logger.info(`GooglePubSub:: Create subscription ${name}`);
    return gTopic.createSubscription(name);
  }

  async subscribe (topic, handler, options = {}) {
    const subscription = await this.__getSubscription(topic, `${topic}-${options.group}`);
    subscription
      .on('message', async (message) => {
        try {
          const payload = JSON.parse(message.data);
          const meta = _.get(message.attributes, 'meta', null);
          await handler(payload, JSON.parse(meta));
          message.ack();
        } catch (error) {
          this.logger.error('GooglePubSub: error', error);
        }
      })
      .on('error', (error) => {
        this.logger.error('GooglePubSub: error', error);
      });
  }
}

module.exports = GooglePubSub;
