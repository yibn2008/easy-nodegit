'use strict'

const os = require('os')
const fs = require('fs')
const path = require('path')
const nodegit = require('nodegit')

const {
  Clone,
  Repository,
  Branch,
  Status,
  Reset,
  Cred
} = nodegit

const DEFAULT_CREDENTIALS = {
  type: 'ssh',
  privateKey: path.join(os.homedir(), '.ssh', 'id_rsa'),
  publicKey: path.join(os.homedir(), '.ssh', 'id_rsa.pub'),
  passphrase: '',
  username: '',
  password: ''
}

class GitRepo {
  /**
   * generate options for fetch
   *
   * ```
   * credentials: {
   *   type: string,        // 'ssh' or 'http'
   *   privateKey: string,  // path to ssh private key
   *   publicKey: string,   // path to ssh public key
   *   passphrase: string,  // passphrase of credentials
   *   username: string,    // http username
   *   password: string,    // http password
   * }
   * ```
   *
   * @param {Object} credentials
   * @return {Object}
   */
  static fetchOptions(credentials) {
    credentials = Object.assign({}, DEFAULT_CREDENTIALS, credentials)

    if (process.platform === 'darwin') {
      callbacks.certificateCheck = () => 1
    }

    callbacks.credentials = (url, username) => {
      if (credentials.type === 'ssh') {
        return Cred.sshKeyNew(
          username,
          credentials.publicKey,
          credentials.privateKey,
          credentials.passphrase
        )
      } else if (credentials.type === 'http') {
        return Cred.userpassPlaintextNew(credentials.username, credentials.password)
      } else {
        return Cred.usernameNew(username)
      }
    }

    return {
      callbacks
    }
  }

  /**
   * init git repo
   * @param {String} dir
   */
  static async init(dir) {
    const repo = await Repository.init(dir)
    repo.free()
  }

  /**
   * clone a repo
   * @param {String} gitUrl
   * @param {String} branch
   * @param {String} target
   * @param {Object} credentials
   */
  static async clone(gitUrl, branch, target, credentials) {
    const repo = Clone(gitUrl, target, {
      checkoutBranch: branch,
      fetchOpts: this.fetchOptions(credentials)
    })

    repo.free()
  }

  /**
   * create GitRepo instance
   *
   * @param {String} dir
   * @param {Object} credentials (optional)
   */
  constructor (dir, credentials) {
    this.dir = dir
    this.rawRepo = null
    this.credentials = Object.assign(DEFAULT_CREDENTIALS, credentials)
    this.id = GitRepo._lastRepoId ++
  }

  /**
   * open a repo
   */
  async open () {
    // repo check
    const openRepos = GitRepo._openRepos
    if (openRepos.indexOf(this.id) >= 0) {
      throw new Error(`repo ${this.dir} has arealdy been opened, you should call free() first`)
    }
    openRepos.push(this.id)

    this.rawRepo = await Repository.open(this.dir)

    // memory leak warning
    if (openRepos.length > 10) {
      console.warn('you have opened more than %s repos without call free(), this may cause memory leaks', openRepos.length)
    }
  }

  /**
   * free a repo (make sure aways call free() when git repo is useless)
   */
  free () {
    this.rawRepo.free()
    this.rawRepo = null

    // remove from openRepos
    const openRepos = GitRepo._openRepos
    openRepos.splice(openRepos.indexOf(this.id), 1)
  }

  /**
   * get options for fetch
   * @returns {Object}
   */
  getFetchOptions () {
    return GitRepo.fetchOptions(this.credentials)
  }

  /**
   * fetch a repo from remote
   * @param {String} remoteName
   */
  async fetch (remoteName) {
    remoteName = remoteName || 'origin'

    await this.rawRepo.fetch(remoteName, this.getFetchOptions())
  }

  /**
   * fetch all remotes
   */
  async fetchAll () {
    await this.rawRepo.fetchAll(this.getFetchOptions())
  }

  /**
   * pull commits from remote (fetch and merge)
   */
  async pull () {
    await this.fetchAll()

    // get current branch
    const branch = await this.rawRepo.getCurrentBranch()
    if (!branch.isHead()) {
      throw new Error(`HEAD is not pointing to current branch ${branch.shorthand()}, cannot pull`)
    }

    // get branch upstream
    const upstream = await Branch.upstream(branch)
    await this.rawRepo.mergeBranches(branch, upstream)
  }

  /**
   * set upstream to branch
   * @param {String} branchName
   * @param {String} upstreamName
   */
  async setUpstream (branchName, upstreamName) {
    const branch = await this.rawRepo.getBranch(branchName)
    await Branch.setUpstream(branch, name)
  }

  /**
   * set upstream to current branch
   * @param {String} name
   */
  async setCurrentUpstream (name) {
    const branch = await this.rawRepo.getCurrentBranch()
    await Branch.setUpstream(branch, name)
  }

  /**
   * push commits to remote
   */
  async push (remoteName) {
    const remote = await this.rawRepo.getRemote(remoteName || 'origin')

    // get current branch
    const branch = await this.rawRepo.getCurrentBranch()
    if (!branch.isHead()) {
      throw new Error(`HEAD is not pointing to current branch ${branch.shorthand()}, cannot pull`)
    }

    // get branch upstream
    const upstream = await Branch.upstream(branch)
    const refspec = `${branch.name()}:${upstream.name()}`

    await remote.push([refspec], this.getFetchOptions())
  }

  /**
   * add pathspec to index
   * @param {String|Array} pathspec
   */
  async add (pathspec) {
    const index = await this.rawRepo.index()
    if (Array.isArray(pathspec)) {
      for (const file of pathspec) {
        await index.addByPath(file)
      }
    } else {
      await index.addAll(pathspec)
    }

    await index.write()
    await index.writeTree()
  }

  /**
   * reset index to head commit
   * @param {String|Array} pathspec
   */
  async reset (pathspec) {
    if (!Array.isArray(pathspec)) {
      pathspec = [ pathspec ]
    }

    const commit = await this.rawRepo.getHeadCommit()
    await Reset.default(this.rawRepo, commit, pathspec)
  }

  /**
   * remove pathspec from index
   * @param {String|Array} pathspec
   */
  async remove(pathspec) {
    const index = await this.rawRepo.index()
    if (Array.isArray(pathspec)) {
      for (let file of pathspec) {
        await index.removeByPath(file)
      }
    } else {
      await index.removeAll(pathspec)
    }

    await index.write()
    await index.writeTree()
  }

  /**
   * get status of repo
   *
   * ```js
   * return [
   *   {
   *     path: 'path/to/file.js',
   *     status: [ 'WT_NEW', 'WT_MODIFIED', ... ]
   *   },
   *   ...
   * ]
   * ```
   *
   * @param {Boolean} untracted
   * @returns {Array}
   */
  async getStatus (untracted) {
    const options = {}
    if (untracted) {
      options.flags = Status.OPT.INCLUDE_UNTRACKED
    }

    const list = await this.rawRepo.getStatus(options)

    return list.map(item => {
      return {
        path: item.path(),
        status: item.status()
      }
    })
  }

  /**
   * get repo branches info
   *
   * ```js
   * return [
   *   {
   *     ref: 'refs/head/master',
   *     name: 'master',
   *     head: true
   *   },
   *   ...
   * ]
   * ```
   *
   * @returns {Array}
   */
  getBranches () {
    const refs = await this.rawRepo.getReferences(Reference.TYPE.OID)

    return refs.filter(ref => ref.isBranch()).map(ref => {
      return {
        ref: ref.name(),
        name: ref.shorthand(),
        head: !!ref.isHead()
      }
    })
  }
}

GitRepo._lastRepoId = 1
GitRepo._openRepos = []

module.exports = GitRepo
