/**
 * ! WIP
 */



// const fetch = require('node-fetch');
// const {
//   Embed,
//   Webhook
// } = require('../util');

// module.exports = {
//   service: 'youtube',
//   run: async (item, config) => {
//     const url = `https://www.reddit.com/r/${config.accounts[item.account].reddit}/hot.json`;
//     let items = await fetch('https://noembed.com/embed?url=' + items[i].link);
//     items = await vid.json();


//     // filtering out outdated items
//     let lastTime = new Date(item.lastTime);
//     lastTime = item.lastTime !== undefined || item.lastTime !== null ? new Date(item.lastTime) : new Date('1970');
//     if (items.length === 0) return lastTime;

//     const webhook = new Webhook()
//       .setUsername(data.title)
//       .setAvater('https://www.redditinc.com/assets/images/site/reddit-logo.png');
//     for (let i = 0; i < items.length; i++) {
//       if (i === 10) break;
//       let itemTime = new Date(items[i].isoDate);
//       if (itemTime <= lastTime) continue;
//       lastTime = itemTime;
//       // no embed stuff//
//       let vid = await fetch('https://noembed.com/embed?url=' + items[i].link);
//       vid = await vid.json();
//       // embed
//       const embed = new Embed()
//         .color('#FF4500')
//         .author(vid.author_name, undefined, vid.author_url)
//         .title(vid.title, vid.url)
//         .image(vid.thumbnail_url)
//         .footer('Uploaded ->')
//         .timestamp(items[i].isoDate);
//       webhook.addEmbed(embed);
//     }
//     let webhooks = config.accounts[item.account].webhooks;
//     for (let i = 0; i < webhooks.length; i++) {
//       await webhook.send(webhooks[i]);
//     }
//     return {
//       time: lastTime
//     };
//   }
// };