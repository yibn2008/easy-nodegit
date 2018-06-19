<a name="GitClient"></a>

## GitClient
Git Client to operate repo

**Kind**: global class  
**Access**: public  

* [GitClient](#GitClient)
    * [new GitClient(dir, credentials)](#new_GitClient_new)
    * [.init()](#GitClient+init)
    * [.clone(url, branchName)](#GitClient+clone)
    * [.pull()](#GitClient+pull)
    * [.fetch(remoteName)](#GitClient+fetch)
    * [.push(remoteName)](#GitClient+push)
    * [.add(pathspec)](#GitClient+add)
    * [.reset(pathspec)](#GitClient+reset)
    * [.remove(pathspec)](#GitClient+remove)
    * [.commit(message)](#GitClient+commit)
    * [.getStatus(untracted)](#GitClient+getStatus) ⇒ <code>Array</code>
    * [.getBranches()](#GitClient+getBranches) ⇒ <code>Array</code>

<a name="new_GitClient_new"></a>

### new GitClient(dir, credentials)
create a git client with root dir and credential info


| Param | Type | Description |
| --- | --- | --- |
| dir | <code>String</code> |  |
| credentials | <code>Object</code> | optional |

<a name="GitClient+init"></a>

### gitClient.init()
init a git repo

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  
<a name="GitClient+clone"></a>

### gitClient.clone(url, branchName)
clone a git repo

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  

| Param | Type |
| --- | --- |
| url | <code>String</code> | 
| branchName | <code>String</code> | 

<a name="GitClient+pull"></a>

### gitClient.pull()
get commits from remote and merge with local changes

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  
<a name="GitClient+fetch"></a>

### gitClient.fetch(remoteName)
fetch commits

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  

| Param | Type |
| --- | --- |
| remoteName | <code>String</code> | 

<a name="GitClient+push"></a>

### gitClient.push(remoteName)
push commits to remote

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  

| Param | Type |
| --- | --- |
| remoteName | <code>String</code> | 

<a name="GitClient+add"></a>

### gitClient.add(pathspec)
add files to index

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  

| Param | Type | Description |
| --- | --- | --- |
| pathspec | <code>String</code> \| <code>Array</code> | - Array: file path list  - String: file path or glob rule |

<a name="GitClient+reset"></a>

### gitClient.reset(pathspec)
reset files from index to last commit

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  

| Param | Type | Description |
| --- | --- | --- |
| pathspec | <code>String</code> \| <code>Array</code> | - Array: file path list  - String: file path or glob rule |

<a name="GitClient+remove"></a>

### gitClient.remove(pathspec)
remove files from index

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  

| Param | Type | Description |
| --- | --- | --- |
| pathspec | <code>String</code> \| <code>Array</code> | - Array: file path list  - String: file path or glob rule |

<a name="GitClient+commit"></a>

### gitClient.commit(message)
commit a message

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  

| Param | Type |
| --- | --- |
| message | <code>String</code> | 

<a name="GitClient+getStatus"></a>

### gitClient.getStatus(untracted) ⇒ <code>Array</code>
get status of index and work directory

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  

| Param | Type |
| --- | --- |
| untracted | <code>Boolean</code> | 

<a name="GitClient+getBranches"></a>

### gitClient.getBranches() ⇒ <code>Array</code>
get branches info

**Kind**: instance method of [<code>GitClient</code>](#GitClient)  
