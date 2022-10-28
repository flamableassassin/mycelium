const {
  readdirSync,
  statSync
} = require('fs');
const path = require('path');
/**
 * Loads files from ./src/sources/*
 * @module fileLoader
 * @returns {Map<String,import("../sources/base")}
 */
module.exports.source = () => {
  const data = new Map();
  const files = readdirSync(path.join(__dirname, '..', 'sources')).filter(file => file.endsWith('.js') && file !== 'base.js');
  for (const file of files) {
    const fileData = require(path.join(__dirname + '/..', 'sources', file));
    if (!Object.hasOwn(fileData, 'execute')) continue;
    data.set(fileData.service, fileData);
  }
  return data;
};

/**
 * Loads files from ./src/modifiers/**
 * @module fileLoader
 * @returns {Map<String,Object}
 */
module.exports.modifiers = () => {
  const data = new Map();
  const dirs = readdirSync(path.join(__dirname, '..', 'modifiers')).filter((file) => statSync(path.join(__dirname, '..', 'modifiers', file)).isDirectory());
  for (const folder of dirs) {
    const sub_folder = readdirSync(path.join(__dirname, '..', 'modifiers', folder)).filter(file => file.endsWith('.js') && file != 'base.js');
    for (const file of sub_folder) {
      const modifier = require(path.join(__dirname, '/..', 'modifiers', folder, file));
      if (!Object.hasOwn(modifier, 'execute')) continue;
      data.set(`${folder}-${modifier.name}`, modifier); // adding the folder name to the key so that there are no conflicts
    }
  }
  return data;
};