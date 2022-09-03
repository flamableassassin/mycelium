const Parser = require('rss-parser');
module.exports = async (url) => {
  const parser = new Parser();
  const data = await parser.parseURL(url);
  return data;
};