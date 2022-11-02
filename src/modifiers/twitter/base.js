const Embed = require('../../util/Embed');
const Webhook = require('../../util/Webhook');
const { twitter } = require('../../util/textParsing');

module.exports = {
  name: '', // The name of the twitter account
  /**
   * @async
   * @param {Object} res
   * @param {import("../../util/Webhook")[]} res.webhooks
   * @param {import("twitter-api-v2").TweetV1[]} res.items
   * @param {import("../../config")} config
   * @return {Promise<import("../../sources/base").sourceReturn>}
   */
  execute: async ({ items, webhooks }, config) => {

  }
};