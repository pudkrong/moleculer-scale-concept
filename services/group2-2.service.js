'use strict';

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

module.exports = {
  name: 'group2-2',

  version: 2,

  events: {
    'group2-1.emit': {
      handler (payload) {
        console.log(`Event group2-1.emit on group2-2 with payload`, payload);
      }
    }
  },
};
