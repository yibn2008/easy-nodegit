'use strict'

const assert = require('assert')
const GitRepo = require('./git-repo')

/**
 * Git Client Class
 * @public
 */
class GitClient {
  /**
   * create a git client with root dir and credential info
   * @param {String} dir
   * @param {Object} credentials optional
   */
  constructor (dir, credentials) {
    this.dir = dir
    this.credentials = credentials
  }

  /**
   * init a git repo
   */
  async init () {
    await GitRepo.init(this.dir)
  }

  /**
   * clone a git repo
   * @param {String} url
   * @param {String} branchName
   */
  async clone (url, branchName) {
    if (!branchName) {
      branchName = 'master'
    }

    await GitRepo.clone(url, branchName, this.dir, this.credentials)
  }

  /**
   * get commits from remote and merge with local changes
   */
  async pull () {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.open()
      await repo.pull()
    } finally {
      repo.free()
    }
  }

  /**
   * fetch commits
   * @param {String} remoteName
   */
  async fetch (remoteName) {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.open()
      await repo.fetch(remoteName)
    } finally {
      repo.free()
    }
  }

  /**
   * fetch commits from all remotes
   */
  async fetchAll () {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.open()
      await repo.fetchAll()
    } finally {
      repo.free()
    }
  }

  /**
   * push commits to remote
   */
  async push () {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.open()
      await repo.push()
    } finally {
      repo.free()
    }
  }

  /**
   * add files to index
   * @param {String|Array} pathspec
   *  - Array: file path list
   *  - String: file path or glob rule
   */
  async add (pathspec) {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.open()
      await repo.add(pathspec)
    } finally {
      repo.free()
    }
  }

  /**
   * reset files from index to last commit
   * @param {String|Array} pathspec
   *  - Array: file path list
   *  - String: file path or glob rule
   */
  async reset (pathspec) {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.open()
      await repo.reset(pathspec)
    } finally {
      repo.free()
    }
  }

  /**
   * remove files from index
   * @param {String|Array} pathspec
   *  - Array: file path list
   *  - String: file path or glob rule
   */
  async remove (pathspec) {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.open()
      await repo.remove(pathspec)
    } finally {
      repo.free()
    }
  }

  /**
   * commit a message
   * @param {String} message
   */
  async commit (message) {
    assert(message, 'message is required')

    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.open()
      await repo.commit(message)
    } finally {
      repo.free()
    }
  }

  async checkout (branchName) {
    assert(branchName, 'branch name is required')

    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.open()
      await repo.checkout(branchName)
    } finally {
      repo.free()
    }
  }

  /**
   * get status of index and work directory
   * @param {Boolean} untracted
   * @returns {Array}
   */
  async getStatus (untracted) {
    const repo = new GitRepo(this.dir, this.credentials)
    let list
    try {
      await repo.open()
      list = await repo.getStatus(untracted)
    } finally {
      repo.free()
    }
    return list
  }

  /**
   * get branches info
   * @returns {Array}
   */
  async getBranches () {
    const repo = new GitRepo(this.dir, this.credentials)
    let branches
    try {
      await repo.open()
      branches = await repo.getBranches()
    } finally {
      repo.free()
    }
    return branches
  }
}

module.exports = GitClient
module.exports.GitRepo = GitRepo
