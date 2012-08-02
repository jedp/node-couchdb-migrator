const cradle = require('cradle');

// db design for testing
function init_db(db, callback) {
  db.save('_design/data', {
    all: {
      map: function(doc) {
        emit(doc._id, doc);
      }
    },
  }, callback);
}

var get_db = module.exports.get_db = function get_db(name) {
  return new (cradle.Connection)('127.0.0.1', 5984).database('name');
};

var get_pristine_db = module.exports.get_pristine_db = function get_pristine_db(name, callback) {
  var db = get_db(name);
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
};
