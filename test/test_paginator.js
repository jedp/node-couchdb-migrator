const Paginator = require('../lib/paginator'),
      cradle = require('cradle'),
      vows = require('vows'),
      assert = require('assert');

function get_db() {
  return new (cradle.Connection)('127.0.0.1', 5984).database('test_paginator');
}

function init_db(db, callback) {
  db.save('_design/data', {
    all: {
      map: function(doc) {
        if (doc.foo) {
          emit(doc.foo, doc);
        }
      }
    },
  }, callback);
}

function get_pristine_db(callback) {
  var db = get_db();
  db.exists(function(err, exists) {
    if (exists) {
      db.destroy(function() {
        db.create(function() {
          init_db(db, function() {
            callback(db);
          });
        });
      });
    } else {
      db.create(function() {
        init_db(db, function() {
          callback(db);
        });
      });
    }
  });
}

vows.describe("Paginator")

.addBatch({
  "We start with": {
    topic: function() {
      var cb = this.callback;
      get_pristine_db(function(db) {
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
      get_pristine_db(function(db) {
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

      "with a paginator": function(err, rows) {
        assert(err === null);
        assert(rows === 42);
      }

    }
  }
})

.addBatch({
  "Remove the database": {
    topic: function() {
      get_db().destroy(this.callback);
    },

    "because we clean up after ourselves": function(err, removed) {
      assert(removed);
    }
  }
})

.export(module);
