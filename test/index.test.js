'use strict'

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const rimraf = require('rimraf')
const GitClient = require('..')

describe('test git client', function () {
  this.timeout(10000)

  const basedir = path.join(__dirname, '.repo')
  const client = new GitClient(basedir)

  beforeEach(() => {
    // clear repo dir
    rimraf.sync(basedir)
    fs.mkdirSync(basedir)
  })

  it('should init repo', async function () {
    await client.init()

    assert(fs.existsSync(path.join(basedir, '.git')))
  })

  it('should add/remove/commit/reset files', async function () {
    await client.init()

    // prepare
    const file1 = path.join(basedir, 'index.js')
    const file2 = path.join(basedir, 'index.scss')
    fs.writeFileSync(file1, 'foobar')
    fs.writeFileSync(file2, 'helloworld')

    // add
    await client.add('index.js')
    const list = await client.getStatus()
    assert.equal(list.length, 1)

    // commit
    await client.commit('initial')

    // add and reset
    await client.add('index.*')
    const list2 = await client.getStatus()
    assert.equal(list2[0].path, 'index.scss')
    assert.equal(list2[0].status[0], 'INDEX_NEW')

    await client.reset('index.*')
    const list3 = await client.getStatus(true)
    assert.equal(list3[0].path, 'index.scss')
    assert.equal(list3[0].status[0], 'WT_NEW')

    // remove
    await client.remove('index.*')
    const list4 = await client.getStatus()
    assert.equal(list4[0].path, 'index.js')
    assert.equal(list4[0].status[0], 'INDEX_DELETED')
  })
})
