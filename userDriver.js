var ObjectID = require('mongodb').ObjectID;

Array.prototype.deleteElementByValue = function(varElement,callback)
{
    var sum = 0;
    for (var i=0; i<this.length; i++)
    {
        // 严格比较，即类型与数值必须同时相
        sum++;
        var str =this[i].deviceMac;
        if ( str === varElement)
        {
           callback(i);
            break;
        }
        if(sum==this.length)
            callback(-1);
    }

}

UserDriver = function(db) {
    this.db = db;
};

UserDriver.prototype.getCollection = function(collectionName, callback) {
    this.db.collection(collectionName, function(error, the_collection) {
        if( error ) callback(error);
        else callback(null, the_collection);
    });
};

UserDriver.prototype.login = function(username,password,callback){
    this.getCollection('user',function(error,collection){
        if (error)
            callback(false);
        else {
                collection.findOne({'username':username}, function(error,doc) { //C
                if (error)
                    callback(false);
                else {
                    if(doc){
                        if (username==doc.username&&password==doc.password){
                            callback(true,doc);
                        }else{
                            callback(false);
                        }
                    }else{
                        callback(false);
                    }
                }
            });
        }
    });
};

UserDriver.prototype.register = function(username,password,callback){
    this.getCollection("user",function(error,collection){
       if(error){
           callback(false);
       }else{
            if(!username&&!password)
                callback(false);
           else{
                var whereStr = {'username':username};
                collection.find(whereStr).toArray(function(error, results) {
                    if(error){
                        callback(false);
                    }else{
                        if(results.length > 0){
                            callback(false);
                        }else{
                            var doc = {'username':username,'password':password,'devices':[]};
                            collection.insert(doc,function(){
                                callback(true);
                            });
                        }
                    }
                });
            }

       }
    });
};

UserDriver.prototype.saveUserInfoHandler = function(req,res){
    var userInfo = req.body;
    var username = userInfo.username;
    var teleNum  = userInfo.teleNum;

    this.getCollection('user',function(error,collection){
        if(error){
            callback(false);
        }else{
            collection.findOne({'username':username}, function(error,doc) {
                if (error)
                    callback(false);
                else {
                    if(doc){
                        doc.teleNum = teleNum;
                        collection.save(doc,function(error){
                            if(error) {
                                res.send({'isSuccess':false});
                            }else{
                                res.send({'isSuccess':true});
                            }
                        });
                    }else{
                        callback(false);
                    }
                }
            });
        }
    });
};

UserDriver.prototype.boundDevice = function(mac,username,callback){
    this.getCollection('user',function(error,collection){
       if(error){
           callback(false);
       }else{
           var whereStr = {'username':username,'devices.deviceMac':mac};
           collection.find(whereStr).toArray(function(error,results){
              if (error){
                  callback(false);
              }else{
                  if (results.length > 0){
                      callback(true)
                  }else{
                      var whereStr2 = {'username':username};
                      collection.find(whereStr2).toArray(function(error,results){
                          var obj = results[0];
                          obj.devices.push({'deviceMac':mac});
                          collection.save(obj,function(error,result){
                              if (error){
                                  callback(false);
                              }else{
                                  callback(true);
                              }
                          });
                      })

                  }
              }
           });
       }
    });
};

UserDriver.prototype.unBoundDevice = function(mac,username,callback){
    this.getCollection('user',function(error,collection){
        if(error){
            callback(false);
        }else{
            var whereStr = {'username':username,'devices.deviceMac':mac};
            collection.find(whereStr).toArray(function(error,results){
                if (error){
                    callback(false);
                }else{
                    if (results.length == 0){
                        callback(true)
                    }else{
                        var whereStr2 = {'username':username};
                        collection.find(whereStr2).toArray(function(error,results){
                            var obj = results[0];
                            obj.devices.deleteElementByValue(mac,function(i){
                                if(i == -1){
                                    callback(false);
                                }else{
                                    obj.devices.splice(i,1);
                                    collection.save(obj,function(error){
                                        if (error){
                                            callback(false);
                                        }else{
                                            callback(true);
                                        }
                                    });
                                }

                            });

                        })

                    }
                }
            });
        }
    });
};

exports.UserDriver = UserDriver;