const Webhook = require('./Webhook');
/**
* Adds embeds to a webhook or it creates a new webhook if it doesn't exist
* @param {import("../util/Embed")[]} embeds
* @param {import("../util//Webhook")[]} webhooks
* @param {string} name // The name of the webhook name
* @param {string} [avatar] // The avatar for the webhook
* @returns {import("../util/Webhook")[]} 
*/
module.exports = (embeds, webhooks, name, avatar = undefined) => {

  // Splitting the embeds which share the same url into their own array 
  // This is done to prevent the tweets from going across webhooks, keeping the same order while using as few webhooks as possible

  /** @type {import("../util/Embed")[][]} */
  const collections = [];
  for (let i = 0; i < embeds.length; i++) {
    const index = collections.findIndex(arr => arr[0]?.url === embeds[i].url);
    if (index === -1) collections.push([embeds[i]]);
    else collections[index].push(embeds[i]);
  }

  for (let i = 0; i < collections.length; i++) {
    if (webhooks.length === 0 || webhooks[webhooks.length - 1].embeds.length + collections[i].length >= 11) webhooks.push(new Webhook(collections[i]).setUsername(name).setAvatar(avatar));
    else webhooks[webhooks.length - 1].addEmbeds(collections[i]);
  }
  return webhooks;
};
