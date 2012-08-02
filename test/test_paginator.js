const Paginator = require('../lib/paginator'),
      dbutils = require('./dbutils'),
      vows = require('vows'),
      assert = require('assert');

vows.describe("Paginator")

.addBatch({
  "We start with": {
    topic: function() {
      var cb = this.callback;
      dbutils.get_pristine_db('test_paginator', function(db) {
        // empty query to get metadata
        db.get('', cb);
      });
    },

    "an empty database": function(err, metadata) {
      assert(err === null);
      assert(metadata.doc_count === 1);
    }
  }
})

.addBatch({
  "42 records": {
    topic: function() {
      var cb = this.callback;
      dbutils.get_pristine_db('test_paginator', function(db) {
        var documents = [];

        // create 42 documents
        for (var i=1; i<=42; i++) {
          documents.push({foo: i});
        }

        // and store them
        db.save(documents, function(err, res) {
          return cb(null, db);
        });
      });
    },

    "can be paged through": {
      topic: function(db) {
        var cb = this.callback;
        var paginator = new Paginator(db, 'data/all');
        var count = 0;

        paginator.on('rows', function(rows) {
          count += rows.length;
          if (rows.length === 0) {
            cb(null, count);
          } else {
            paginator.next();
          }
        });
        paginator.next();
      },

      "with a paginator": function(err, count) {
        assert(err === null);
        assert(count === 42);
      }

    }
  }
})

.addBatch({
  "Remove the database": {
    topic: function() {
      dbutils.get_db('test_paginator').destroy(this.callback);
    },

    "because we clean up after ourselves": function(err, removed) {
      assert(removed);
    }
  }
})

.export(module);
