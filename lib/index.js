'use strict'

const GitRepo = require('./git-repo')

class GitClient {

  constructor (dir, credentials) {
    this.dir = dir
    this.credentials = credentials
  }

  async init () {
    await GitRepo.init(this.dir)
  }

  async clone (url, branch) {
    if (!branch) {
      branch = 'master'
    }

    await GitRepo.clone(url, branch, this.dir, this.credentials)
  }

  async pull() {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.pull()
    } finally {
      repo.free()
    }
  }

  async fetch(remoteName) {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.fetch(remoteName)
    } finally {
      repo.free()
    }
  }

  async push(remoteName) {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.push(remoteName)
    } finally {
      repo.free()
    }
  }

  async add(pathspec) {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.add(pathspec)
    } finally {
      repo.free()
    }
  }

  async reset (pathspec) {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.reset(pathspec)
    } finally {
      repo.free()
    }
  }

  async remove (pathspec) {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.remove(pathspec)
    } finally {
      repo.free()
    }
  }

  async getStatus () {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.getStatus()
    } finally {
      repo.free()
    }
  }

  async getBranches () {
    const repo = new GitRepo(this.dir, this.credentials)
    try {
      await repo.getBranches()
    } finally {
      repo.free()
    }
  }
}

module.exports = GitClient
