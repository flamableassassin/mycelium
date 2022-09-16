const Embed = require('../../util/Embed');
const Webhook = require('../../util/Webhook');
const { twitter } = require('../../util/textParsing');


module.exports = {
  name: '', // The name of the twitter account
  /**
   * @async
   * @param {import("twitter-api-v2").TweetV1} tweets
   * @param {import("../../util/Webhook")[]} webhooks
   * @param {import("twitter-api-v2").TwitterApi} client
   * @return {Promise<import("../../util/Webhook")[]>}
   */
  execute: async (tweets, webhooks, client) => {

  }
};