var cradle = require('cradle'),
    Paginator = require('./paginator');

var Migrator = module.exports = function Migrator(db_name, options) {
  this.db_name = db_name;
  options = options || {};

  this.host = options.host || '127.0.0.1';
  this.port = options.port || 5984;

  this.conn = new (cradle.Connection)(this.host, this.port);
  this.db = this.conn.database(this.db_name);

  return this;
};

Migrator.prototype = {
  /**
   * Migrate all documents according to the transformations in xforms
   *
   * @param xforms
   *        (list)    A list of tuples of strings.  Any keys that match
   *                  the first string in a tuple should be renamed to
   *                  the second.
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
  migrate: function(xforms) {
    console.log("migrate");
    var paginator = new Paginator(this.db);
    var done = false;

    paginator.on('rows', function(rows){
      if (rows.length) {

        // this is where we take each of the rows, modify it according to the
        // xforms rules, and then save all rows in bulk back up to the db.
        // Note that the only way to delete fields in a couchdb document is
        // to save the entire document again.

        paginator.next();
      }
    });

    paginator.next();
  }
};