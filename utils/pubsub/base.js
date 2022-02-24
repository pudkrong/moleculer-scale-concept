const _ = require('lodash');
class Base {
  constructor (options) {
    this.options = _.defaultsDeep(options, {
      logger: console
    });
  }

  async publish (topic, payload) {
    throw new Error('Not implemented method!');
  }

  async subscribe (topic, handler) {
    throw new Error('Not implemented method!');
  }
}

module.exports = Base;