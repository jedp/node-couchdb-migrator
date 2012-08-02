const Migrator = require('../lib/migrator'),
      dbutils = require('./dbutils'),
      fs = require('fs'),
      path = require('path'),
      vows = require('vows'),
      assert = require('assert'),
      CWD = path.dirname(__filename);


vows.describe("Migrator")

.addBatch({
  "We start with": {
    topic: function() {
      var cb = this.callback;
      dbutils.get_pristine_db('test_migrator', function(db) {
        fs.readFile(CWD + '/fixtures/database.json', 'utf-8', function(err, data) {
          db.save(JSON.parse(data).rows, function(err, res) {
            cb(err, res);
          });
        });
      });
    },

    "a database needing migration": function(err, res) {
      assert(err === null);
      assert(res.length > 0);
    }
  }
})

.addBatch({
  "Remove the database": {
    topic: function() {
      dbutils.get_db('test_migrator').destroy(this.callback);
    },

    "because we clean up after ourselves": function(err, removed) {
      assert(removed);
    }
  }
})



.export(module);