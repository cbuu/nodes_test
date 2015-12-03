var ObjectID = require('mongodb').ObjectID;

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
            if(!username&&!password) callback(false);
            var doc = {'username':username,'password':password,'devices':[]};
            collection.insert(doc,function(){
                callback(true);
            });
       }
    });
};


exports.UserDriver = UserDriver;