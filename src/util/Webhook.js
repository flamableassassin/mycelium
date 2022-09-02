const { fetch } = require('undici');
const endpoint = 'https://discord.com/api/webhooks/';

/**
 * Represents a discord webhook
 * @class
 * @property {String} content The webhook content
 * @property {String} username The webhook username
 * @property {String} avatar_url A url for the webhook avatar
 * @property {import("./Embed")[]} embeds The embeds for the webhook
 */
class Webhook {
  /**
    * @param {import("./Embed")[]} [embeds=[]]
    * @return {Webhook} An instance of itself
   */
  constructor(embeds = []) {
    Object.assign(this, {
      content: '',
      username: 'Social Media',
      embeds: embeds
    });
    return this;
  }

  /**
   * Sets the avatar for the webhook
   * @param {String} url
   * @return {Webhook} An instance of itself
   */
  setAvatar(url) {
    this.avatar_url = url;
    return this;
  }
  /**
   * Sets the username for the webhook
   * @param {String} name
   * @return {Webhook} An instance of itself
   */
  setUsername(name) {
    this.username = name;
    return this;
  }

  /**
   * Adds content to the avatar for the webhook
   * @param {String} msg
   * @return {Webhook} An instance of itself
   */
  addContent(msg) {
    this.content = msg;
    return this;
  }
  /**
   * Adds an Embed to the webhook
   * @param {import("./Embed")} embed
   * @return {Webhook} An instance of itself
   */
  addEmbed(embed) {
    this.embeds.push(embed);
    return this;
  }

  /**
    * Adds Embeds to the webhook
    * @param {import("./Embed")[]} embeds
    * @return {Webhook} An instance of itself
  */
  addEmbeds(embeds) {
    /** @type {import("./Embed")[]} */
    this.embeds = this.embeds.concat(embeds);
    return this;
  }
  /**
 * Sends the webhook to a discord webhook
 * @param {String} id The webhook id
 * @param {String} token The webhook token
 * @returns {Promise<import("node-fetch").Response>}
 */
  async send(id, token) {
    if (this.embeds.length > 10) return Promise.reject('To many embeds in webhook');
    if (this.embeds.length === 0) return Promise.reject('No embeds in webhook');
    return fetch(endpoint + id + '/' + token, {
      method: 'post',
      body: JSON.stringify(this),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
module.exports = Webhook;