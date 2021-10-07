const Embed = require('../util/Embed'),
  Webhook = require('../util/Webhook'),
  Twitter = require('twitter-lite');
/**
 * NGL idk what half this stuff does. I did it like 6 months ago at the time of writing (3 October 2021). I tried my best to add comments
 */
module.exports = {
  service: 'twitter',
  /**
   * @param {import("@prisma/client").Account} item
   * @returns {Promise<import("./base").sourceReturn>}
   */
  run: async (item, config) => {
    let webhookTitle = items.find(item => item.user.screen_name === item.account);
    webhookTitle = webhookTitle !== undefined ? item[webhookTitle].user.name : item.name;


    let items = await fetchFeed(item.name, config),
      lastTime = new Date(item.lastCheck),
      webhooks = [];
    const itemsLast = lastTime;

    items = items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));


    for (let i = 0; i < items.length; i++) {
      let itemTime = new Date(items[i].created_at);
      if (itemTime <= itemsLast) continue;
      if (itemTime > lastTime) lastTime = itemTime;
      const twitterItem = items[i];

      const des = regexStuff(twitterItem);
      let embed = new Embed()
        .color('#1DA1F2')
        .title(twitterItem.user.name, `https://twitter.com/${twitterItem.user.screen_name}/status/${twitterItem.id_str}`)
        .footer('Sent->')
        .timestamp(itemTime.toISOString())
        .description(des)
        .thumbnail(twitterItem.user.profile_image_url_https);
      if (Object.prototype.hasOwnProperty.call(twitterItem, 'extended_entities') && Object.prototype.hasOwnProperty.call(twitterItem.extended_entities, 'media')) {
        let images = twitterItem.extended_entities.media.filter((obj) => obj.type === 'animated_gif' || obj.type === 'photo');
        for (let l = 0; l < images.length; l++) {
          embed.image(images[l].media_url_https);
          addEmbed(embed, webhooks);
          embed = new Embed()
            .color('#1DA1F2')
            .title(twitterItem.user.name, `https://twitter.com/${twitterItem.user.screen_name}/status/${twitterItem.id_str}`)
            .footer('Sent->')
            .timestamp(itemTime.toISOString())
            .description(des)
            .thumbnail(twitterItem.user.profile_image_url_https);
        }
      } else addEmbed(embed, webhooks);
    }



    // dealing with webhooks
    return {
      webhooks: webhooks,
      time: lastTime
    };

    /**
    * Adds an embed to a webhook or it creates a new one
    * @param {import("../util/Embed")} embed
    * @returns {import("../util/Webhook")[]} 
  */
    function addEmbed(embed) {
      if (webhooks.length === 0 || webhooks[webhooks.length - 1].embeds.length >= 10) webhooks.push(new Webhook([embed])
        .setUsername(`Twitter - @${webhookTitle}`)
        .setAvatar('https://file.coffee/u/T-jUPyudy9.png'));
      else webhooks[webhooks.length - 1].addEmbed(embed);
      return webhooks;
    }
  }
};

// From: https://github.com/twitter/twitter-text/blob/33169dfd33d61debdbf58dc940f5a200c06def10/js/pkg/twitter-text-3.1.0.js#L2586-L2592
const HTML_ENTITIES = {
  '&amp;': '&',
  '&gt;': '\>', // eslint-disable-line no-useless-escape
  '&lt;': '<',
  '&quot;': '"',
  '&#39;': '\''
},
  urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/,
  hashTag = /(\B#(\w*[a-zA-Z]+\w*))/g,
  mentionTag = /(\B@(\w*[a-zA-Z]+\w*))/g,
  HTML_ENTITIES_REGEX = /(&amp;|&quot;|&gt;|&lt;|&#39;)/g;

// TODO: escape chars like: * | ` _ to prevent it from affecting the formatting of the embed
function regexStuff(data) {
  let full_text = data.full_text.replace(HTML_ENTITIES_REGEX, (g1) => HTML_ENTITIES[g1]);

  if (Object.prototype.hasOwnProperty.call(data, 'retweeted_status')) {
    // Retweets
    const retweetInfo = data.retweeted_status;
    const des = retweetInfo.full_text
      .replace(hashTag, (g1) => `[${g1}](https://twitter.com/hashtag/${g1.slice(1)})`)
      .replace(mentionTag, (g1) => `[${g1}](https://twitter.com/${g1.slice(1)})`)
      .replace(HTML_ENTITIES_REGEX, (g1) => HTML_ENTITIES[g1]);

    full_text = `${data.user.name} Retweeted [${retweetInfo.user.screen_name}](https://twitter.com/${retweetInfo.user.screen_name}/status/${retweetInfo.id_str}):\n\n>>> ` + des;
  } else if (Object.prototype.hasOwnProperty.call(data, 'quoted_status')) {
    // Quoted messages
    const quoteInfo = data.quoted_status;
    const des = quoteInfo.full_text
      .replace(hashTag, (g1) => `[${g1}](https://twitter.com/hashtag/${g1.slice(1)})`)
      .replace(mentionTag, (g1) => `[${g1}](https://twitter.com/${g1.slice(1)})`)
      .replace(HTML_ENTITIES_REGEX, (g1) => HTML_ENTITIES[g1]);

    // eslint-disable-next-line no-control-regex
    full_text = `> ${data.full_text.replace(new RegExp('\n', 'g'), '\n> ').replace(HTML_ENTITIES_REGEX, (g1) => HTML_ENTITIES[g1])}\n\n${data.user.name} Quoted [${quoteInfo.user.screen_name}](https://twitter.com/${quoteInfo.user.screen_name}/status/${quoteInfo.id_str}):\n>>> ` + des;
  } else {
    // hyperlinking urls
    full_text = full_text.replace(urlRegex, (g1) => `[${g1}](${g1})`)
      // hash tags
      .replace(hashTag, (g1) => `[${g1}](https://twitter.com/hashtag/${g1.slice(1)})`)
      // mention tags
      .replace(mentionTag, (g1) => `[${g1}](https://twitter.com/${g1.slice(1)})`)
      // Replacing html entities
      .replace(HTML_ENTITIES_REGEX, (g1) => HTML_ENTITIES[g1]);
    // Replies
    if (data.in_reply_to_status_id !== null) {
      full_text = `${data.user.name} Replied to [${data.in_reply_to_screen_name}](https://twitter.com/${data.in_reply_to_screen_name}/status/${data.in_reply_to_status_id_str})\n\n>>> ` + full_text;
    }
  }
  return full_text;
}


async function fetchFeed(account, config) {
  const client = new Twitter(config.secrets);

  return client.get('statuses/user_timeline', {
    screen_name: account,
    exclude_replies: config.exclude_replies ?? true,
    tweet_mode: 'extended'
  });
}

