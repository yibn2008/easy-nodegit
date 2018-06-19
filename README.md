# easy-nodegit

A simple and elegant git client base on nodegit.

## install

```bash
npm install easy-nodegit --save
```

## Usage

Simple git client API, just like using git command:

```js
const GitClient = require('easy-nodegit')
const client = new GitClient('/path/to/repo/work/directory', {
  type: 'ssh',                        // support 'ssh' or 'http', default is 'ssh'
  // when type == 'ssh'
  privateKey: '/path/to/privateKey',  // default is ~/.ssh/id_rsa
  publicKey: '/path/to/publicKey'     // default is ~/.ssh/id_rsa.pub
  // when type == 'http'
  username: '...',
  password: '...'
})

async function test () {
  // clone
  await client.clone('git@github.com:yibn2008/easy-nodegit.git')

  // add
  await client.add([
    'index.js',
    'index.css'
  ])
  await client.add('lib/**/*.js')

  // reset
  await client.reset('index.*')

  // remove
  await client.remove('lib/modules/*')

  // commit
  await client.commit('commit message')

  // pull
  await client.pull()

  // push
  await client.push()
}

test().catch(err => {
  console.error(err)
})
```

## API

see [API.md](./API.md)

## LICENSE

MIT
