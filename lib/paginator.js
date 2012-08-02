var events = require('events'),
    util = require('util');

/**
 * Utility for paging through a couchdb database.
 *
 * @param db
 *        (instance)    Instance of a 'cradle' db object
 *
 * @param view
 *        (string)      The CouchDB view to query
 *
 * @param pageSize
 *        (integer)     Optional rows per page.  Default = 10.
 *
 * Paginator emits the following signals:
 *
 * 'rows'  - A list of rows read from couch.  [] if none or at end.
 * 'error' - Error reading from database.
 */
var Paginator = function Paginator(db, view, pageSize) {
  events.EventEmitter.call(this);
  this.init(db, view, pageSize);
  return this;
};
util.inherits(Paginator, events.EventEmitter);

Paginator.prototype.init = function(db, view, pageSize) {
  this.db = db;
  this.view = view;
  this.pageSize = pageSize || 10;

  this._startkey_docid = 0;
  this._startkey = 0;
  this._done = false;
};

Paginator.prototype.end = function() {
  this.db = null;
  this.removeAllListeners();
};

/**
 * Emit next page (group of rows) from the db.
 *
 * @param count
 *        (integer)   How many rows to fetch.  Default=10.
 *
 */
Paginator.prototype.next = function(count) {
  if (this._done) {
    this.emit('rows', []);
    return;
  }

  count = count || this.pageSize;

  //Pagination algorithm from guide.couchdb.org:
  //
  // - Request 'count' + 1 rows from the view
  // - Emit 'count' rows, store + 1 row as next _startkey and _startkey_docid
  // - Use the _next_* values to query the subsequent pages
  this.db.view(this.view, {
    startkey_docid: this._startkey_docid,
    startkey: this._startkey,
    limit: count+1
  }, function(err, docs) {
    if (err) {
      this.emit('error', err);
      return;
    }
    var rows = docs.length;
    if (rows < count + 1) {
      // Read last docs in db
      this._done = true;
      this.emit('rows', docs);
    } else {
      var nextStartDoc = docs[rows-1];
      this._startkey_docid = nextStartDoc.id;
      this._startkey = nextStartDoc.key;
      this.emit('rows', docs.slice(0, count));
    }
  }.bind(this));
};

module.exports = Paginator;