// #region const stuff
// From: https://github.com/twitter/twitter-text/blob/33169dfd33d61debdbf58dc940f5a200c06def10/js/pkg/twitter-text-3.1.0.js#L2586-L2592
const HTML_ENTITIES = {
  '&amp;': '&',
  '&gt;': '\>', // eslint-disable-line no-useless-escape
  '&lt;': '<',
  '&quot;': '"',
  '&#39;': '\''
};
const urlRegex = /(https:\/\/t.co\/(\w+))/g;
const tagRegex = /(\B[#@](\w*[a-zA-Z]+\w*))/g;
const HTML_ENTITIES_REGEX = /(&amp;|&quot;|&gt;|&lt;|&#39;)/g;
// #endregion




/**
 * @param {string} full_text // The full_text of the tweet
 * @param {import("twitter-api-v2").TweetEntitiesV1} tweetEntities
 * @returns {string} // The parsed text
 */
function parseTweetFull_text(full_text, tweetEntities) {
  return full_text
    .replace(urlRegex, (g1, g2) => {
      const url = tweetEntities.urls.find((url) => url.url === g2)?.expanded_url;
      if (url) return `[${url}](${url})`;
      return '';
    })
    // parsing hash tags and mention tags
    .replace(tagRegex, (g1, g2, g3) => `[${g1}](https://twitter.com${g2 === '#' ? '/hashtag' : ''}/${g3})`)
    // Replacing html entities
    .replace(HTML_ENTITIES_REGEX, (g1) => HTML_ENTITIES[g1])
    .trim();
}


module.exports = {
  parseTweetFull_text
};