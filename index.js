var http = require('http'),
    express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    FileDriver = require('./fileDriver').FileDriver,
    CollectionDriver = require('./collectionDriver').CollectionDriver,
    UserDriver = require('./userDriver').UserDriver,
    DeviceDriver = require('./deviceDriver').DeviceDriver;

var app = express();
app.set('port',process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var mongoHost = 'localHost'; //A
var mongoPort = 27017;
var collectionDriver;
var fileDriver;
var userDriver;
var deviceDriver;

var mongoClient = new MongoClient(new Server(mongoHost, mongoPort));
mongoClient.open(function(err, mongoClient) { //C
    if (!mongoClient) {
        console.error("Error! Exiting... Must start MongoDB first");
        process.exit(1); //D
    }
    var db = mongoClient.db("test");  //E
    collectionDriver = new CollectionDriver(db); //F
    fileDriver = new FileDriver(db);
    userDriver = new UserDriver(db);
    deviceDriver = new DeviceDriver(db);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname,'public')));





app.get('/', function (req, res) {
    res.render('hello');
});

app.get('/registerDevice',function(req,res){
    deviceDriver.getAllMac(function(error,deviceMacArr){
        if(error)res.sendStatus(404);
        else{
            res.render('registerDevice',{'deviceMacArr':deviceMacArr,'title':'注册设备'});
        }
    });
});

app.post('/registerDevice',function(req,res){
    var deviceMac = req.body.deviceMac;
    deviceDriver.registerMac(deviceMac,function(error){
       if (error) res.sendStatus(404);
        else {
           res.sendStatus(200);
       }
    });
});

app.get('/login',function(req,res){
    var username = req.query.username;
    var password = req.query.password;

    var isMobile = req.headers['ismobile'];

        if(username && password){
            userDriver.login(username,password,function(isSuccess,user){
                //res.set('Content-Type','application/json');
                if(isSuccess){
                    res.send({'isSuccess':true,'user':user});
                }else {
                    res.send({'isSuccess':false});
                }
            });
        }else{
            res.send({'isSuccess':false});
        }
});

app.post('/register',function(req,res){
    var body = req.body;
    var username = body['username'];
    var password = body['password'];

    if (username && password){
        userDriver.register(username,password,function(isSuccess){
            //res.set('Content-Type','application/json');
            if(isSuccess){
                res.send({'isSuccess':true,'type':'register'});
            }else {
                res.send({'isSuccess':false,'type':'register'});
            }
        });
    }else{
        res.send({'isSuccess':false,'type':'register'});
    }
});

app.get('/devices/:deviceMac',function(req,res){
    var deviceMac = req.params.deviceMac;
    deviceDriver.getDeviceInfo(deviceMac,function(error,device){
       if(error){
           //res.send({'isSuccess':})
       }
    });

});

app.post('/batchGetDevicesInfo',function(req,res){
    var devicesMac = req.body['devicesMac'];
    var count = devicesMac.length;
    var devices = new Array();
    var sum = 0;
    devicesMac.forEach(function(deviceMac,index){
        deviceDriver.getDeviceInfo(deviceMac,function(error,device){
           if (error){
               res.send({'isSuccess':false});
               return ;
           }else{
               devices.push(device);
               sum++;
           }
            if(sum==count) {
                send(devices);
            }
        });
    });

    function send(devices) {
        res.send({'isSuccess':true,'devices':devices});
    }

});

app.put('/boundDevice',function(req,res){
    var deviceMac = req.body['deviceMac'];
    var username  = req.body['username'];

    userDriver.boundDevice(deviceMac,username,function(isSuccess){
        res.send({'isSuccess':isSuccess});
    })
});

app.delete('/unBoundDevice',function(req,res){
    var deviceMac = req.body['deviceMac'];
    var username  = req.body['username'];

    userDriver.unBoundDevice(deviceMac,username,function(isSuccess){
        res.send({'isSuccess':isSuccess});
    });
});


app.post('/files', function(req,res) {fileDriver.handleUploadRequest(req,res);});

app.get('/files/:id', function(req, res) {fileDriver.handleGet(req,res);});

app.get('/:collection', function(req, res, next) {
    var params = req.params;
    var query = req.query.query; //1
    if (query) {
        query = JSON.parse(query); //2
        collectionDriver.query(req.params.collection, query, returnCollectionResults(req,res)); //3
    } else {
        collectionDriver.findAll(req.params.collection, returnCollectionResults(req,res)); //4
    }
});

function returnCollectionResults(req, res) {
    return function(error, objs) { //5
        if (error) { res.send(400, error); }
        else {
            if (req.accepts('html')) { //6
                res.render('data',{objects: objs, collection: req.params.collection});
            } else {
                res.set('Content-Type','application/json');
                res.send(200, objs);
            }
        }
    };
};



app.get('/:collection/:entity', function(req, res) { //I
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
        collectionDriver.get(collection, entity, function(error, objs) { //J
            if (error) { res.status(400).send(err); }
            else { res.status(200).send(objs); } //K
        });
    } else {
        res.send(400, {error: 'bad url', url: req.url});
    }
});

app.post('/:collection', function(req, res) { //A
    var object = req.body;
    var collection = req.params.collection;
    console.log(collection);
    collectionDriver.save(collection, object, function(err,docs) {
        if (err) { res.status(400).send(err); }
        else { res.status(201).send(docs);  console.log(docs);} //B
    });
});

app.put('/:collection/:entity', function(req, res) { //A
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
        collectionDriver.update(collection, req.body, entity, function(error, objs) { //B
            if (error) { res.status(400).send(err); }
            else { res.status(200).send(objs); } //C
        });
    } else {
        var error = { "message" : "Cannot PUT a whole collection" };
        res.status(400).send(err);
    }
});


app.delete('/:collection/:entity', function(req, res) { //A
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
        collectionDriver.delete(collection, entity, function(error, objs) { //B
            if (error) { res.status(400).send(err); }
            else { res.status(200).send(objs); } //C 200 b/c includes the original doc
        });
    } else {
        var error = { "message" : "Cannot DELETE a whole collection" };
        res.status(400).send(err);
    }
});



// error handle for 404 not found
app.use(function (req,res) {
    res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
