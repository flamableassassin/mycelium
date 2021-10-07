const fetch = require('node-fetch');
const {
  fetchFeed,
  Embed,
  Webhook
} = require('../util');

module.exports = {
  service: 'youtube',
  run: async (item, config) => {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${config.accounts[item.account].youtube}`;
    const data = await fetchFeed(url);
    // filtering out outdated items
    let lastTime = new Date(item.lastTime);
    const itemsLast = lastTime;
    const items = data.items.sort((a, b) => new Date(a.isoDate) - new Date(b.isoDate));

    const embeds = [];
    for (let i = 0; i < items.length; i++) {
      let itemTime = new Date(items[i].isoDate);
      if (itemTime <= itemsLast) continue;
      if (itemTime > lastTime) lastTime = itemTime;
      // no embed stuff//
      let vid = await fetch('https://noembed.com/embed?url=' + items[i].link);
      vid = await vid.json();
      // embed
      const embed = new Embed()
        .color('#FF0000')
        .author(vid.author_name, undefined, vid.author_url)
        .title(vid.title, vid.url)
        .image(vid.thumbnail_url)
        .footer('Uploaded ->')
        .timestamp(items[i].isoDate);
      embeds.push(embed);
    }


    let webhook = new Webhook()
      .setUsername(data.title)
      .setAvater('https://file.coffee/u/WzGykTATtw.png');

    let webhooks = config.accounts[item.account].webhooks;

    for (let i = 0; i < embeds.length; i++) {
      if (webhook.embeds.length === 10) {
        for (let l = 0; l < webhooks.length; l++) {
          await webhook.send(webhooks[l]);
        }
        let webhook = new Webhook()
          .setUsername(data.title)
          .setAvater('https://file.coffee/u/WzGykTATtw.png');
      } else webhook.addEmbed(embeds[i]);
    }

    for (let i = 0; i < webhooks.length; i++) {
      webhook.send(webhooks[i]);
    }
    return {
      time: lastTime
    };
  }
};