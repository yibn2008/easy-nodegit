'use strict'

const os = require('os')
const path = require('path')
const nodegit = require('nodegit')

const {
  Clone,
  Repository,
  Branch,
  Status,
  Reset,
  Cred,
  Reference
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
  static fetchOptions (credentials) {
    credentials = Object.assign({}, DEFAULT_CREDENTIALS, credentials)

    const callbacks = {}
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
  static async init (dir) {
    const repo = await Repository.init(dir, 0)
    repo.free()
  }

  /**
   * clone a repo
   * @param {String} gitUrl
   * @param {String} branch
   * @param {String} target
   * @param {Object} credentials
   */
  static async clone (gitUrl, branch, target, credentials) {
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
    if (!this.rawRepo) {
      return
    }

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
   * get branch upstream
   * @param {String} branchName
   * @returns {Object}
   */
  async getUpstream (branchName) {
    const branch = await this.rawRepo.getBranch(branchName)
    const upstream = await Branch.upstream(branch)
    if (upstream) {
      return {
        ref: upstream.name(),
        name: upstream.shorthand()
      }
    }
  }

  /**
   * set upstream to branch
   * @param {String} branchName
   * @param {String} upstreamName
   */
  async setUpstream (branchName, upstreamName) {
    const branch = await this.rawRepo.getBranch(branchName)
    await Branch.setUpstream(branch, upstreamName)
  }

  /**
   * push commits to remote
   */
  async push (remoteName) {
    if (!remoteName) {
      const currentBranch = await this.rawRepo.getCurrentBranch()
      remoteName = await Branch.remoteName(this.rawRepo, currentBranch.name())
    }
    const remote = await this.rawRepo.getRemote(remoteName)

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
  async remove (pathspec) {
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
   * create commit on head
   * @param {String} message
   */
  async commit (message) {
    const author = this.rawRepo.defaultSignature()
    await await this.rawRepo.createCommitOnHead([], author, author, message)
  }

  /**
   * checkout branch
   * @param {String} branchName
   */
  async checkout (branchName) {
    const branchRef = `refs/head/${branchName}`
    const refNames = await this.rawRepo.getReferenceNames(nodegit.Reference.TYPE.LISTALL)

    // create if branch not exists
    if (refNames.indexOf(branchRef) < 0) {
      const currentBranch = await this.rawRepo.getCurrentBranch()
      const remoteName = await Branch.remoteName(this.rawRepo, currentBranch.name())
      const remoteBranchName = `${remoteName}/${branchName}`
      const refer = await this.rawRepo.getBranch(remoteBranchName)
      const newRefer = await this.rawRepo.createBranch(branchName, refer.target())
      await nodegit.Branch.setUpstream(newRefer, remoteBranchName)
    }

    this.rawRepo.checkoutBranch(branchName)
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
   * get current branch info
   * @returns {Object}
   */
  async getCurrentBranch () {
    const branch = await this.rawRepo.getCurrentBranch()
    if (branch) {
      return {
        ref: branch.name(),
        name: branch.shorthand(),
        head: !!branch.isHead()
      }
    }
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
  async getBranches () {
    const refs = await this.rawRepo.getReferences(Reference.TYPE.OID)
    const branches = []

    for (const ref of refs) {
      if (ref.isBranch()) {
        branches.push({
          ref: ref.name(),
          name: ref.shorthand(),
          head: !!ref.isHead()
        })
      }
    }

    return branches
  }
}

GitRepo._lastRepoId = 1
GitRepo._openRepos = []

module.exports = GitRepo
