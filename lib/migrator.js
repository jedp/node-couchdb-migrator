var cradle = require('cradle'),
    Paginator = require('./paginator');

var Migrator = module.exports = function Migrator(db_name, options) {
  this.db_name = db_name;
  options = options || {};

  this.host = options.host || '127.0.0.1';
  this.port = options.port || 5984;
  this.rows_per_page = options.rows_per_page || 10;

  this.conn = new (cradle.Connection)(this.host, this.port);
  this.db = this.conn.database(this.db_name);

  return this;
};

Migrator.prototype = {
  /**
   * Migrate all documents according to the transformations in xforms
   *
   * @param xforms
   *        (list)      A list of tuples of strings.  Any keys that match
   *                    the first string in a tuple should be renamed to
   *                    the second.
   *
   * @param view
   *        (string)    The CouchDB view that can get the records you want
   *                    to migrate.  Probably something like 'data/all'.
   *
   * @param callback
   *        (function)  Function to call on completion.  First argument will
   *                    be error or null for no error.  On success, second
   *                    argument will be number of records migrated.
   *
   * For example, given:
   *
   *   xforms = [ ['foo', 'bar'] ]
   *
   * And given the following document:
   *
   *   { foo: 42, pie: 'yes' }
   *
   * Migrate would change it to:
   *
   *   { bar: 42, pie: 'yes' }
   */
  migrate: function(xforms, view, callback) {
    callback = callback || function(){};

    var self = this;
    var paginator = new Paginator(this.db, view, this.rows_per_page);
    var replkeys = Object.keys(xforms);
    var done = false;
    var newRows = [];

    paginator.on('error', function(err) {
      return callback(err);
    });

    paginator.on('rows', function(rows){
      if (rows.length) {

        // XXX horrible hack
        // XXX dumb-ass string replace with no context
        // this will work for my immediate needs (in which the keys are
        // all long, weird, and not going to show up in document bodies),
        // but it makes this unusable by anyone else.
        //
        // XXX would like to use jsonselect to identify items to change,
        // XXX but not sure how to modify the orig once they've been selected.
        for (var i=0; i<rows.length; i++) {
          var original = JSON.stringify(rows[i].value, null, 4);
          var rowString = original;
          replkeys.forEach(function(key) {
            rowString = rowString.replace(key, xforms[key]);
          });
          if (rowString !== original) {
            newRows.push(JSON.parse(rowString));
          }
        };
        paginator.next();
      } else {
        self.save(newRows, callback);
      }
    });

    paginator.next();
  },

  save: function(rows, callback) {
    var count = rows.length;
    if (rows.length) {
      this.db.save(rows, function(err, results) {
        callback(err, results);
      });
    } else {
      callback(null, 0);
    }
  }
};