#!/usr/bin/env node

'use strict';
/* global process */

/* 
 * Copyright (C) 2016 Alexis
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var yargs = require('yargs')
  .boolean('h')
  .alias('h', 'help')
  .describe('h', 'Help message')
  .alias('v', 'view')
  .describe('v', 'The view name including the design doc prefix')
  .alias('k', 'key')
  .array('k')
  .describe('k', 'The key(s) to fetch')
  .alias('vk', 'viewkey')
  .describe('vk', 'The view key on wich the documents will be indexed.')
  .alias('d', 'designdoc')
  .boolean('d')
  .describe('dd', 'Determine if a design doc will be created if querying views.')
  .alias('o', 'output-file')
  .describe('o', 'Output file (else will dump to stdout)')
  .alias('u', 'username')
  .describe('u', 'Username for the CouchDB database (if it\'s protected)')
  .alias('p', 'password')
  .describe('p', 'Password for the CouchDB database (if it\'s protected)')
  .example('$0 http://localhost:5984/mydb > dump.txt',
    'Dump from the "mydb" CouchDB to dump.txt')
//  .example('$0 /path/to/mydb > dump.txt',
//    'Dump from the "mydb" LevelDB-based PouchDB to dump.txt')
  .example('$0 http://localhost:5984/mydb -o dump.json',
    'Dump to the specified file instead of stdout')
  .example('$0 http://example.com/mydb -u myUsername -p myPassword > dump.txt',
    'Specify a CouchDB username and password if it\'s protected');
var argv = yargs.argv;
if (argv.h) {
  yargs.showHelp();
  return process.exit(1);
}


var dbName = argv._[0];
if (!dbName) {
  console.error('You need to supply a database URL or filepath. -h for help');
  return process.exit(1);
}


//Modules loading
var pdsConstruct = require("./index.js");
var fs = require('fs');
//Parameter
var outfile = argv.o;
var password = argv.p;
var username = argv.u;
var useDesignDoc = argv.dd;
var viewKey = argv.vk;
var view = argv.v;
var keys = argv.k;

//Instance
/**
 * @type DumpSelect
 */
var pds;
try {
  pds = new pdsConstruct(dbName, username, password);
} catch (e) {
  console.error(e);
  return process.exit(1);
}

if (view && viewKey) {
  console.error("You can't fetch from a view and a key-value pair at the same time.");
  return process.exit(1);
}



if (view) {
  pds.getByView(view, keys).then(function(rows) {
    writeContent(rows);
  }).catch(function(err) {
    console.error(err);
    return process.exit(1);
  });
} else if (viewKey) {
  pds.getByKeyValue(viewKey, keys, {}, useDesignDoc).then(function(rows) {
    writeContent(rows);
  }).catch(function(err) {
    console.error(err);
    return process.exit(1);
  });
} else {
  pds.getAll(keys).then(function(rows) {
    writeContent(rows);
  }).catch(function(err) {
    console.error(err);
    return process.exit(1);
  });
}


function writeContent(content) {
  var outstream;
  if (outfile) {
    outstream = fs.createWriteStream(outfile, {
      encoding: 'utf8'
    });
  } else {
    // need to set encoding for process.stdout explicitly
    // otherwise for instance German umlaute are mangled
    if (typeof process.stdout.setEncoding === 'function') {
      // only works in older versions of Node apparently?
      process.stdout.setEncoding('utf8');
    }
    outstream = process.stdout;
  }

  outstream.on('finish', function() {
    console.info("File has been written.");
  });
  outstream.write(JSON.stringify(content));
  if (outfile)
    outstream.end();
}
