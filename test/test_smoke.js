const vows = require('vows'),
      assert = require('assert'),
      Paginator = require('../lib/paginator'),
      Migrator = require('../lib/migrator');

vows.describe('CouchDB Connectivity')

.addBatch({
  "We can establish": {
    topic: function() {
      return new Migrator('test_foo');
    },

    "a handle on a CouchDB database": function(migrator) {
      assert(migrator.db);
    },

    "and attach": {
      topic: function(migrator) {
        return new Paginator(migrator.db, 'data/all');
      },

      "a paginator to the database": function(paginator) {
        assert(paginator.db !== null);
      }

    }
  }
})

.export(module);
