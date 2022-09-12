const { fetch } = require('undici');
const { youtube } = require('../util/textParsing');
const Embed = require('../util/Embed');
const embedToWebhook = require('../util/embedsToWebhooks');
const xmlParser = new (require('fast-xml-parser').XMLParser);

module.exports = {
  service: 'youtube',
  /**
   * @param {import("@prisma/client").Account} item
   * @returns {Promise<import("./base").sourceReturn>}
   */
  execute: async (item, config) => {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${item.name}`;

    const feed = await (await fetch(url)).text();
    const data = xmlParser.parse(feed.toString());

    const inputData = data.feed;
    const entries = inputData.entry
      .filter(i => new Date(i.published) > item.lastCheck) // filter out old videos
      .sort((a, b) => new Date(a.published) - new Date(b.published)); // sorting the tweets by date so that the oldest video is first

    const embeds = [];
    for (let i = 0; i < entries.length; i++) {
      const item = entries[i];
      const embed = new Embed()
        .setColor('#FF0000')
        .setAuthor(item.author.name, undefined, item.author.uri)
        .setTitle(item.title, `https://www.youtube.com/watch?v=${item['yt:videoId']}`)
        .setImage(`https://i.ytimg.com/vi/${item['yt:videoId']}/hqdefault.jpg`)
        .setTimestamp(item.published);

      let description = youtube(item['media:group']['media:description']);
      const length = 250;
      if (description.length >= length) description = description.substring(0, length).split(' ').slice(0, -1).join(' ') + '...';

      embed.setDescription(description);
      embeds.push(embed);
    }

    return {
      webhooks: embedToWebhook(embeds, [], inputData.author.name, 'https://file.coffee/u/WzGykTATtw.png'),
      time: new Date(entries[entries.length - 1].published)
    };
  }
};