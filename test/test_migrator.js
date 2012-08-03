const Migrator = require('../lib/migrator'),
      dbutils = require('./dbutils'),
      fs = require('fs'),
      path = require('path'),
      vows = require('vows'),
      assert = require('assert'),
      jselect = require('JSONSelect'),
      CWD = path.dirname(__filename);

var recordsInFixture;

vows.describe("Migrator")

.addBatch({
  "We start with": {
    topic: function() {
      var cb = this.callback;
      dbutils.get_pristine_db('test_migrator', function(db) {
        fs.readFile(CWD+'/fixtures/kpi.json', 'utf-8', function(err, data) {
          var rows = [];
          JSON.parse(data).rows.forEach(function(row) {
            rows.push(row.value);
          });
          recordsInFixture = rows.length;
          db.save(rows, function(err, res) {
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
  "The migrator": {
    topic: function() {
      var cb = this.callback;
      // Important for testing - rows_per_page less than total num of documents
      // that will be changed.  Makes sure we don't get dupes during async changes.
      var migrator = new Migrator('test_migrator', {rows_per_page: 2});
      fs.readFile(CWD+'/fixtures/kpi.xforms.json', 'utf-8', function(err, data) {
        migrator.migrate(JSON.parse(data), 'data/all', cb);
      });
    },

    "transforms some records": function(err, results) {
      assert(err === null);
      assert(results.length > 0 && results.length < recordsInFixture);
    },

    "stores the records": {
      topic: function() {
        var db = dbutils.get_db('test_migrator');
        db.view('data/all', this.callback);
      },

      "over the originals": function(err, rows) {
        assert(err === null);
        assert(rows.length === recordsInFixture);
      },

      "with the right changes": function(err, rows) {
        assert(jselect.match('.id:val("7bd667b02084e64359a77da430e1818f") '
                      +' ~ .value .event_stream '
                      +' array:has(:root > *:val("picker::signin"))', rows).length === 0);

        assert(jselect.match('.id:val("7bd667b02084e64359a77da430e1818f") '
                      +' ~ .value .event_stream '
                      +' array:has(:root > *:val("i::like::pie"))', rows).length > 0);

        assert(jselect.match('.id:val("7bd667b02084e64359a77da430e1f7a6") '
                      +'~ .value .event_stream '
                      +' array:has(:root > *:val("reepicheep"))', rows).length > 0);
      }
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