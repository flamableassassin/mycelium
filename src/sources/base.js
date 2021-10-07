const {
  fetchFeed,
  Embed,
  Webhook
} = require('../util');

module.exports = {
  name: 'name',
  /**
   * @param {import("@prisma/client").Account} item
   * @returns {Promise<sourceReturn>}
   */
  run: async (item, config) => {

    return {
      time: new Date(),
      data: {} // anything the code may want to use next time its run.
    };

  }
};
/**
 * The return data for a source file
 * @typedef {Object} sourceReturn
 * @property {import("../util/Webhook")[]} [webhooks] webhooks which need to be sent
 * @property {JSON} [data] Data to be pushed to the db
 * @property {Date} [time] The time of the last item
 */