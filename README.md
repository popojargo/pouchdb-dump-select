# pouchdb-dump-select
Inspired from [pouchdb-dump-cli](https://www.npmjs.com/package/pouchdb-dump-cli). This package extends the capabilities of pouchdb-dump-cli to query specific data and dump it into a file. You can access it via the CLI or directly using the library. *Note that importing this package into your code only gives you an easy access to query your PouchDB instance.*

#Installation
To install this package, simply run this command : `npm i pouchdb-dump-select`. If you plan to use the CLI, I suggest that you install it globally like this : `npm i  -g pouchdb-dump-select`.


#CLI

Once installed, you can use this command to access the CLI : `pouchdb-ds` which stands for PouchDB-Dump-Select.

Full parameters bellow :

```
Options:
  -h, --help         Help message                                      [boolean]
  -v, --view         The view name including the design doc prefix
  --vk, --viewkey    The view key on wich the documents will be indexed.
  -k, --key          The key(s) to fetch
  --dd, --designdoc  Determine if a design doc will be created if querying
                     views.
  -o, --output-file  output file (else will dump to stdout)
  -u, --username     username for the CouchDB database (if it's protected)
  -p, --password     password for the CouchDB database (if it's protected)
  -s, --split        split into multiple files, for every n docs

Examples:
  C:\Users\alexi\AppData\Roaming\npm\node_  Dump from the "mydb" CouchDB to
  modules\pouchdb-dump-select\bin.js        dump.txt
  http://localhost:5984/mydb > dump.txt
  C:\Users\alexi\AppData\Roaming\npm\node_  Dump from the "mydb" LevelDB-based
  modules\pouchdb-dump-select\bin.js        PouchDB to dump.txt
  /path/to/mydb > dump.txt
  C:\Users\alexi\AppData\Roaming\npm\node_  Dump to the specified file instead
  modules\pouchdb-dump-select\bin.js        of stdout
  /path/to/mydb -o dump.txt
  C:\Users\alexi\AppData\Roaming\npm\node_  Specify a CouchDB username and
  modules\pouchdb-dump-select\bin.js        password if it's protected
  http://example.com/mydb -u myUsername -p
  myPassword > dump.txt

```



#Library

The actual library is a constructor with 3 public methods. 

You can access the full documentation [here](https://popojargo.github.io/pouchdb-dump-select/docs/index.html).

So first of all, you  need to require the actual library :
```
var PDS = require("pouchdb-dump-select");
```





#Note
This package is **not stable yet**, so don't you it in a production environment. CLI parameters and functions might changes. I will try to write a changelog if it happens.



#TODO :
- Complete README doc.
- Add unit test on the main code
- Add tests on the CLI.
- Add some format parameter so this tool is compatible with PouchDB-load
- Reimplement the split file save
