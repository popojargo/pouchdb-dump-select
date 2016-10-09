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
'use strict';
var DEFAULT_DESIGN_DOC = 'pouchdb-dump-select';

//Module loading
var PouchDB = require("pouchdb");
var Args = require("vargs").Constructor;
var URL = require("url");
var Clone = require("clone");
var Equal = require("deep-equal");
var Merge = require("merge");
/**
 * Constructor for the DumpSelect object.
 * @constructor
 * @param {String} url The url of the PouchDB database.
 * @param {String} username [] The username of the remote database if required.
 * @param {String} password [] The password of the remote database if required.
 */
var DumpSelect = function (url, username, password) {
	try {
		url = this._buildUrl(url, username, password);
	} catch (e) {
		//Throw error
	}
	//Init

	/**
	 * @public
	 */
	this.db = new PouchDB(url);
};


/**
 * Get all the document according to the ids.
 * @param {Array|String} ids The id or the ids of the documents to fetch.
 * @param {Object} queryOpts [{}]  Additionnal PouchDB query options.
 * @returns {Promise}	Returns a promise with the an array of rows as result.
 */
DumpSelect.prototype.getAll = function (ids, queryOpts) {
	var options = {include_docs: true};
	var dis = this;
	if (ids) {
		if (!Array.isArray(ids))
			options.key = ids;
		else
			options.keys = ids;
	}
	if (queryOpts && typeof queryOpts === "object")
		options = Merge(queryOpts, options);
	return this.db.allDocs(options).then(function (result) {
		return new Promise(function (resolve, reject) {
			resolve(dis._cleanRows(result));
		});
	});
};


/**
 * Get the rows from a view.
 * @param {String} view		The view name without the _design. Eg : "global/by_name".
 * @param {Array|String} keys	The key or keys to fetch from the view.
 * @param {Object} queryOptions [{}]	Additionnal PouchDB query options.
 * @returns {Promise}	Returns a promise with the rows as result.
 */
DumpSelect.prototype.getByView = function (view, keys, queryOptions) {
	var options = {include_docs: true};
	var dis = this;
	if (keys)
		options['key' + (Array.isArray(keys) ? 's' : '')] = keys;

	if (queryOptions && typeof queryOptions === "object")
		options = Merge(queryOptions, options);
	return this.db.query(view, options).then(function (result) {
		return new Promise(function (resolve, reject) {
			resolve(dis._cleanRows(result));
		});
	}).catch(function (err) {
		console.error(err);
	});
};

/**
 * Get rows by a key-values conditions.
 * @param {String} key	The key of each doc that will be compared.
 * @param {Array|String} values	The value(s) to fetch from the key-value condition.
 * @param {Object} queryOptions [{}]	Additionnal  PouchDB query options. 
 * @param {Boolean} useDesignDoc [false] Determine if a design document will be created or no.
 * @returns {Promise}	Return a promise with the rows that matched the key-value condition.
 */
DumpSelect.prototype.getByKeyValue = function (key, values, queryOptions, useDesignDoc) {
	//Callback reference fix
	var dis = this;

	//Parameter validation
	if (!key)
		throw new TypeError("The key parameter must not be null");
	if (arguments.length >= 4) {
		if (typeof queryOptions !== "object")
			queryOptions = {};
		if (typeof useDesignDoc !== "boolean")
			useDesignDoc = false;
	} else {
		if (typeof queryOptions === "boolean") {
			useDesignDoc = queryOptions;
			queryOptions = {};
		} else {
			useDesignDoc = false;
		}
	}
	var defaultOpts = {include_docs: true};
	if (values)
		defaultOpts["key" + (Array.isArray(values) ? 's' : '')] = values;

	return this._getViewParameter(key, useDesignDoc).then(function (view) {
		queryOptions = Merge(queryOptions, defaultOpts);
		return dis.db.query(view, queryOptions);
	}).then(function (result) {
		return new Promise(function (resolve, reject) {
			resolve(dis._cleanRows(result));
		});
	}).catch(function (err) {
		console.error(err);
	});
};

//<editor-fold desc="Private functions" defaultstate="collapsed">

/**
 * Clean the result object of CouchDB by returning only valid rows.
 * @private
 * @param {Object} result
 * @returns {Array} Returns an array of valid rows.
 */
DumpSelect.prototype._cleanRows = function (result) {
	var rows = [];
	if (result && result.rows && result.rows.length > 0)
		for (var i = 0; i < result.rows.length; i++)
			if (!result.rows[i].error && result.rows[i].doc)
				rows.push(result.rows[i].doc);
	return rows;
};

/**
 * Create a view on the defined design document.
 * @private
 * @throws {TypeError} Throws a TypeError if the supplied parameters are invalids.
 * @param {String} name	The name of the view to add
 * @param {Function|String} map The map function or string.
 * @param {Function|String} reduce	The reduce string or function
 * @returns {Promise}	Returns a promise.
 */
DumpSelect.prototype._getOrCreateView = function (name, map, reduce) {
	var dis = this;
	if (!name)
		throw new TypeError("You must specified the name of your view");

	//Check if it exists
	return dis._getDesignDoc(this.db, DEFAULT_DESIGN_DOC).then(function (doc) {
		newDoc = dis._putView(doc, name, map, reduce);
		if (Equal(doc, newDoc)) {
			return new Promise(function (resolve, reject) {
				resolve(newDoc);
			});
		} else
			return dis.db.put(doc);

	}).then(function (result) {
		return new Promise(function (resolve, reject) {
			resolve(DEFAULT_DESIGN_DOC + '/' + name);
		});
	}).catch(function (err) {
		console.error("An error occured" + err);
	});
};

/**
 * Put a view into a design document
 * @private
 * @param {Object} doc	The document to add the view to.
 * @param {String} name	The name of the view to add or update
 * @param {String|Function} map	The map function or the map string
 * @param {String|Function} reduce	The reduce function or the reduce string.
 * @returns {Object}	Returns the document updated if possible.
 */
DumpSelect.prototype._putView = function (doc, name, map, reduce) {
	if (!doc || typeof doc !== "object")
		return doc;
	//Document validation
	var newDoc = Clone(doc);
	if (!newDoc.views)
		newDoc.views = {};
	//Create the view
	if (!newDoc.views[name])
		newDoc.views[name] = {};
	//Validate map and reduce props.
	if (!newDoc.views[name].map)
		newDoc.views[name] = {map: "", reduce: ""};
	//Add map
	if (map && newDoc.views.map != map.toString()) //Update if necessary
		newDoc.views[name].map = map.toString();
	//Add reduce
	if (reduce && newDoc.views.reduce != map.toString())
		newDoc.views[reduce].reduce = reduce.toString();
	return newDoc;
};

/**
 * Get the design doc and creates it if it's not existing
 * @private
 * @param {type} name	The name of the design document
 * @returns {Promise}
 */
DumpSelect.prototype._getDesignDoc = function (name) {
	var id = '_design/' + name;
	var dis = this;
	this.db.get(id).catch(function (err) {
		if (err.status === '404')
			return dis.put({
				_id: '_design/' + name,
				language: "javascript"
			});
	});
};

/**
 * Returns a promise with the view parameter of the .query() function. 
 * This could be either a design/view name or a map function.
 * @param {String} key	The key used for the mapping
 * @param {type} useDesignDoc [false] Determine if a design document will be created in the database.
 *  If not, it will be filtered locally.
 * @returns {Promise}	Returns a promise with the first parameter.
 */
DumpSelect.prototype._getViewParameter = function (key, useDesignDoc) {
	var mapFn = "function(doc){if(doc." + key + ")emit(doc." + key + ");}";
	if (useDesignDoc)//We try to fetch a _design/view string
		return this._getOrCreateView('by_' + key, mapFn);
	else //We use local filtering with a javascript function
		return new Promise(function (resolve, reject) {
			resolve(mapFn);
		});
};

/**
 * Build the database URL for PouchDB.
 * @private
 * @throws {TypeError} Throws a type error if the username and password are not well supplied.
 * @param {String} url The url of the database
 * @param {String} username [] The username for the remote database if required.
 * @param {String} password [] The password for the remote database if required.
 */
DumpSelect.prototype._buildUrl = function (url, username, password) {
	if ((password && !username) || (!password && username))
		throw new TypeError("Both username and password must be defined. You can't provide only one of them.");
	if (username) {
		var parsedUrl = URL.parse(url);
		if (parsedUrl.protocol)
			throw new TypeError("Username/Password are only for remote databases");
		url = parsedUrl.protocol + '//' + encodeURIComponent(username) + ':' + encodeURIComponent(password) + '@' + parsedUrl.host + parsedUrl.path;
	}
	return url;
};

//</editor-fold>

module.exports = DumpSelect;
