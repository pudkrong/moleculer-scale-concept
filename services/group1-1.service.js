'use strict';
const ApiService = require('moleculer-web');
const gateway = require('../middlewares/gateway.middleware');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
module.exports = {
  name: 'group1-1',
  mixins: [ApiService],
  settings: {
    port: process.env.PORT || 3000,
    use: [
      gateway()
    ]
  },

  /**
	 * Actions
	 */
  actions: {

    /**
		 * Say a 'Hello' action.
		 *
		 * @returns
		 */
    emit: {
      async handler (ctx) {
        ctx.broker.emit('group1-1.emit', { word: 'From group1-1.emit' });
        return 'Hello from group1-1.emit';
      }
    },

    /**
		 * Welcome, a username
		 *
		 * @param {String} name - User name
		 */
    broadcast: {
      /** @param {Context} ctx  */
      async handler (ctx) {
        ctx.broker.broadcast('group1-1.broadcast', { word: 'From group1-1.broadcast' });
        return 'Hello from group1-1.broadcast';
      }
    }
  },

  /**
	 * Events
	 */
  events: {
    'group2-1.emit': {
      handler (payload) {
        console.log(`Event group2-1.emit on group1-1 with payload`, payload);
      }
    }
  }
};
