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


DeviceDriver.prototype.getAllMac = function(callback){
  this.getCollection('devices',function(error,collection){
      if(error)callback(error);
      else{
          collection.find({},{'deviceMac':1,'deviceName':1,'_id':0}).toArray(function(error,doc){
             callback(error,doc);
          });
      }
  }) ;
};

DeviceDriver.prototype.registerMac = function(deviceMac,callback){
    this.getCollection('devices',function(error,collection){
        if(error)callback(error);
        else{
            collection.findOne({'deviceMac':deviceMac}, function(error,doc){
                if(error)callback(error);
                else{
                    if (doc) callback(true);
                    else{
                        var device = {'deviceMac':deviceMac,'deviceName':'antiloss','image':''};
                        collection.insert(device,function(){
                           callback(null);
                        });
                    }
                }
            });
        }
    })
};

DeviceDriver.prototype.isRegisteredHandler = function (req,res,callback) {
    var mac = req.query.mac;

    this.getCollection('devices',function(error,collection){
        if(error){

        }else{
            collection.findOne({'deviceMac':mac},function(error,doc){
                if(error){
                    res.send({'isRegistered':false});
                }else{
                    if(doc){
                        res.send({'isRegistered':true});
                    }else{
                        res.send({'isRegistered':false});
                    }
                }
            });
        }

    });
}

DeviceDriver.prototype.updateDeviceHandler = function(req,res,callback){
    var body = req.body;
    var deviceMac = body.deviceMac;
    var deviceName = body.deviceName;
    var imagePath = body.imagePath;
    this.getCollection('devices',function(error,collection){
        if (error)
            callback(false);
        else{
            collection.findOne({'deviceMac':deviceMac}, function(error,doc){
                if(error)callback(false);
                else{
                    if (null != deviceName) doc.deviceName = deviceName;
                    if (null != imagePath)  doc.image = imagePath;
                    collection.save(doc,function(error){
                        if (error){
                            res.send({'isSuccess':false});
                        }else{
                            res.send({'isSuccess':true});
                        }
                    });
                }
            });
        }
    });
};

exports.DeviceDriver = DeviceDriver;