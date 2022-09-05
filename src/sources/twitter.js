const Embed = require('../util/Embed');
const Webhook = require('../util/Webhook');
const { parseTweetFull_text } = require('../util/twitter');
const { TwitterApi } = require('twitter-api-v2');


module.exports = {
  service: 'twitter',
  /**
   * @param {import("@prisma/client").Account} item
   * @param {import("../config")} config
   * @returns {Promise<import("./base").sourceReturn>}
   */
  execute: async (item, config) => {
    const client = new TwitterApi(config.secrets);

    // let data = (await client.v1.userTimelineByUsername(item.name, {
    //   since_id: Math.round(item.lastCheck - 0 / 1000)
    // })).data;
    let data = require('../../data.json');


    if (data.length === 0) return { webhooks: [], newLastCheck: new Date() };

    data = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // sorting the tweets by date so that the oldest tweet is first

    let webhooks = [];

    for (let i = 0; i < data.length; i++) {
      webhooks = generateWebhooks(data[i], webhooks);
    }

    return { webhooks, time: new Date(data[data.length - 1].created_at) };

  }
};


/**
 * @param {import("../util//Webhook")[]} webhooks
 * @param {import("twitter-api-v2").TweetV1} tweet
 * @param {Boolean} [isQuote = false]
 * @returns {import("../util//Webhook")[] | import("../util/Embed")}  // Returns an array of webhooks or embeds if the tweet is a retweet
 */
function generateWebhooks(tweet, webhooks, isQuote = false) {
  const embeds = [];
  const tweetTime = new Date(tweet.created_at);


  let des = tweet.full_text;

  if (Object.prototype.hasOwnProperty.call(tweet, 'retweeted_status')) {
    // Retweets
    const retweetInfo = tweet.retweeted_status;
    const reTweetDes = parseTweetFull_text(retweetInfo.full_text, retweetInfo.entities);

    des = `${tweet.user.name} Retweeted [${retweetInfo.user.screen_name}](https://twitter.com/${retweetInfo.user.screen_name}/status/${retweetInfo.id_str}):\n\n>>> ` + reTweetDes;

  } else if (Object.prototype.hasOwnProperty.call(tweet, 'quoted_status')) {
    // Quoted messages
    const quoteInfo = tweet.quoted_status;
    const originalTweetText = parseTweetFull_text(tweet.full_text, tweet.entities).replaceAll('\n', '\n> ');
    des = `> ${originalTweetText}\n\n${tweet.user.name} Quoted [${quoteInfo.user.screen_name}](https://twitter.com/${quoteInfo.user.screen_name}):`;

    if (isQuote) {
      const quoteTweetText = parseTweetFull_text(quoteInfo.full_text, tweet.entities);
      des += `\n\n>>> ${quoteTweetText}`;
    } else {
      const quotedWebhooks = generateWebhooks(quoteInfo, webhooks, true);
      embeds.push(...quotedWebhooks);
    }

  } else {
    // Just a normal tweet
    des = parseTweetFull_text(des, tweet.entities);

    // Replies
    if (tweet.in_reply_to_status_id !== null) {
      des = `${tweet.user.name} Replied to [${tweet.in_reply_to_screen_name}](https://twitter.com/${tweet.in_reply_to_screen_name}/status/${tweet.in_reply_to_status_id_str})\n\n>>> ` + des;
    }
  }


  let embed = new Embed()
    .setColor('#1DA1F2')
    .setTitle(tweet.user.name, `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`)
    .setTimestamp(tweetTime.toISOString())
    .setDescription(des)
    .setThumbnail(tweet.user.profile_image_url_https);

  /** @type {import("twitter-api-v2").MediaEntityV1[]} */
  let media = [];

  if (Object.prototype.hasOwnProperty.call(tweet, 'retweeted_status') && Object.prototype.hasOwnProperty.call(tweet.retweeted_status.extended_entities, 'media')) {
    media = tweet.retweeted_status.extended_entities.media.filter((obj) => obj.type === 'animated_gif' || obj.type === 'photo');
  }
  if (Object.prototype.hasOwnProperty.call(tweet, 'extended_entities') && Object.prototype.hasOwnProperty.call(tweet.extended_entities, 'media')) {
    media = tweet.extended_entities.media.filter((obj) => obj.type === 'animated_gif' || obj.type === 'photo');
  }

  if (media.length !== 0) {
    for (let l = 0; l < media.length; l++) {
      embed.setImage(media[l].media_url_https);
      embeds.push(embed);
      embed = new Embed()
        .setColor('#1DA1F2')
        .setTitle(tweet.user.name, `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`);
    }
  } else embeds.push(embed);


  if (isQuote) return embeds;
  return addEmbeds(embeds, webhooks, tweet.user.screen_name);
}

/**
   * Adds embeds to a webhook or it creates a new webhook if it doesn't exist
    * @param {import("../util/Embed")[]} embeds
    * @param {import("../util//Webhook")[]} webhooks
    * @param {string} name // The twitter account name
    * @returns {import("../util/Webhook")[]} 
   */
function addEmbeds(embeds, webhooks, name) {

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
    if (webhooks.length === 0 || webhooks[webhooks.length - 1].embeds.length + collections[i].length >= 11) webhooks.push(new Webhook(collections[i]).setUsername(`Twitter - @${name}`).setAvatar('https://file.coffee/u/T-jUPyudy9.png'));
    else webhooks[webhooks.length - 1].addEmbeds(collections[i]);
  }
  return webhooks;
}
