/**
 * Created by iori on 15/12/1.
 */
var ObjectID = require('mongodb').ObjectID;

DeviceDriver = function(db) {
    this.db = db;
};

DeviceDriver.prototype.getCollection = function(collectionName, callback) {
    this.db.collection(collectionName, function(error, the_collection) {
        if( error ) callback(error);
        else callback(null, the_collection);
    });
};


DeviceDriver.prototype.getDeviceInfo = function(deviceMac,callback){
  this.getCollection('devices',function(error,collection){
      if(error)callback(error);
      else{
          collection.findOne({'deviceMac':deviceMac}, function(error,doc){
            callback(error,doc);
          });
      }
  });
};


exports.DeviceDriver = DeviceDriver;