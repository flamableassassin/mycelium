const {
  readdirSync
} = require('fs');
/**
 * Loads files from ./src/sources
 * @module fileLoader
 * @returns {Map<String,import("../sources/base")}
 */
module.exports = () => {
  const data = new Map();
  const files = readdirSync('./src/sources').filter(file => file.endsWith('.js') && file !== 'base.js');
  for (const file of files) {
    const fileData = require(`../sources/${file}`);
    data.set(fileData.service, fileData);
  }
  return data;
};