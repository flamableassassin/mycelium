
const tagRegex = /([#@])(\w*[0-9a-zA-Z]+\w*)/g;
const HTML_ENTITIES_REGEX = /(&amp;|&quot;|&gt;|&lt;|&#39;)/g;

// https://urlregex.com/
const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

const HTML_ENTITIES = {
  '&amp;': '&',
  '&gt;': '\>', // eslint-disable-line no-useless-escape
  '&lt;': '<',
  '&quot;': '"',
  '&#39;': '\''
};


const twitterURLRegex = /(https:\/\/t.co\/(\w+))/g;


/**
 * @param {string} description The description of the video
 * @returns {string} The parsed description
 */

module.exports.youtube = (description) => description
  .replace(tagRegex, (g1, g2) => `[${g1 + g2}](https://www.youtube.com/${g2 === '#' ? `hashtag/${g2}` : `search?query=${g2}`})`)
  .replace(urlRegex, (g1) => `[${g1}](${g1})`)
  .replace(HTML_ENTITIES_REGEX, (g1) => HTML_ENTITIES[g1])
  .trim();



/**
* @param {string} full_text // The full_text of the tweet
* @param {import("twitter-api-v2").TweetEntitiesV1} tweetEntities
* @returns {string} // The parsed text
*/
module.exports.twitter = (full_text, tweetEntities) => full_text
  .replace(twitterURLRegex, (g1, g2) => {
    const url = tweetEntities.urls.find((url) => url.url === g2)?.expanded_url;
    if (url) return `[${url}](${url})`;
    return '';
  })
  // parsing hash tags and mention tags
  .replace(tagRegex, (g1, g2, g3) => `[${g1}](https://twitter.com${g2 === '#' ? '/hashtag' : ''}/${g3})`)
  // Replacing html entities
  .replace(HTML_ENTITIES_REGEX, (g1) => HTML_ENTITIES[g1])
  .trim();