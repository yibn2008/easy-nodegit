'use strict'

const fs = require('fs')
const path = require('path')
const extend = require('extend')
const getGitConfigPath = require('git-config-path')
const parseConfig = require('parse-git-config').sync

module.exports = function (dir) {
  const globalPath = getGitConfigPath('global')
  let config = {}
  if (fs.existsSync(globalPath)) {
    config = parseConfig(globalPath)
  }

  if (dir) {
    let newConfig = parseConfig(path.join(dir, '.git', 'config'))
    extend(true, config, newConfig)
  }

  return config
}
