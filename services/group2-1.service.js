'use strict';
const ApiService = require('moleculer-web');
const gateway = require('../middlewares/gateway.middleware');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: 'group2-1',
  mixins: [ApiService],
  settings: {
    port: process.env.PORT || 3000,
    use: [
      gateway()
    ]
  },

  events: {
    'group1-1.*': {
      handler (payload) {
        console.log(`Event group1-1.* on group2-1 with payload`, payload);
      }
    }
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
        ctx.broker.emit('group2-1.emit', { word: 'From group2-1.emit' });
        return 'Hello from group2-1.emit';
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
        ctx.broker.broadcast('group2-1.broadcast', { word: 'From group2-1.broadcast' });
        return 'Hello from group2-1.broadcast';
      }
    }
  },
};
