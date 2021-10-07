const Parser = require('rss-parser');
module.exports = async (url) => {
  let parser = new Parser();
  let data = await parser.parseURL(url);
  return data;
};