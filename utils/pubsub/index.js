const Base = require('./base');
const _ = require('lodash');

const PubSub = {
  Base,
  Kubemq: require('./kubemq'),
  Google: require('./google')
};

function getByName (name) {
  if (!name) return null;

  let n = Object.keys(PubSub).find(n => n.toLowerCase() == name.toLowerCase());
  if (n) return PubSub[n];
}

function resolve (opt) {
  if (opt instanceof PubSub.Base) {
    return opt;
  } else if (_.isString(opt)) {
    let PubSubClass = getByName(opt);
    if (PubSubClass) return new PubSubClass(opt.options);
  } else if (_.isObject(opt)) {
    let PubSubClass = getByName(opt.type);
    if (PubSubClass) {
      return new PubSubClass(opt.options);
    } else {
      throw new Error(`Invalid logger configuration: '${opt}'`, { type: opt });
    }
  }
}

function register (name, value) {
  PubSub[name] = value;
}

module.exports = Object.assign(PubSub, { resolve, register });
