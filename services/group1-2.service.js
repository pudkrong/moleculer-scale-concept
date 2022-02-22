'use strict';

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: 'group1-2',

  events: {
    'group1-1.emit': {
      handler (payload) {
        console.log(`Event group1-1.emit on group1-2 with payload`, payload);
      }
    },

    'group1-1.broadcast': {
      handler (payload) {
        console.log(`Event group1-1.broadcast on group1-2 with payload`, payload);
      }
    }
  }
};
