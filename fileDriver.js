
var ObjectID = require('mongodb').ObjectID,
	fs = require('fs');

FileDriver = function(db){
	this.db = db;
};


FileDriver.prototype.getCollection = function(callback) {
	this.db.collection('files', function(error, file_collection) { //1
		if( error ) callback(error);
		else callback(null, file_collection);
	});
};

FileDriver.prototype.get = function(id, callback) {
	this.getCollection(function(error, file_collection) { //1
		if (error) callback(error);
		else {
			var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$"); //2
			if (!checkForHexRegExp.test(id)) callback({error: "invalid id"});
			else file_collection.findOne({'_id':ObjectID(id)}, function(error,doc) { //3
				if (error) callback(error);
				else callback(null, doc);
			});
		}
	});
};

FileDriver.prototype.handleGet = function(req, res) { //1
	var fileId = req.params.id;
	if (fileId) {
		this.get(fileId, function (error, thisFile) { //2
			if (error) {
				res.status(400).send(error);
			}
			else {
				if (thisFile) {
					var filename = fileId + thisFile.ext; //3
					var filePath = __dirname + '/uploads/' + filename; //4
					res.sendFile(filePath); //5
				} else res.status(404).send('file not found');
			}
		});
	} else {
		res.status(404).send('file not found');
	}
};

FileDriver.prototype.save = function(obj, callback) { //1
	this.getCollection(function(error, the_collection) {
		if( error ) callback(error);
		else {
			obj.created_at = new Date();
			the_collection.insert(obj, function() {
				callback(null, obj);
			});
		}
	});
};

FileDriver.prototype.downloadImage = function (req,res) {
	var imagePath = req.query.imagePath;
	res.sendFile(imagePath);
};

FileDriver.prototype.getNewFileId = function(newobj, callback) { //2
	this.save(newobj, function(err,obj) {
		if (err) { callback(err); }
		else { callback(null,obj._id); } //3
	});
};

FileDriver.prototype.handleUploadRequest = function(req, res) { //1
	var ctype = req.get("content-type"); //2
	var ext = ctype.substr(ctype.indexOf('/')+1); //3
	if (ext) {ext = '.' + ext; } else {ext = '';}
	this.getNewFileId({'content-type':ctype, 'ext':ext}, function(err,id) { //4
		if (err) { res.status(400).send(err); }
		else {
			var filename = id + ext; //5
			filePath = __dirname + '/uploads/' + filename; //6

			var writable = fs.createWriteStream(filePath); //7
			req.pipe(writable); //8
			req.on('end', function (){ //9
				res.status(201).send({'_id':id});
			});
			writable.on('error', function(err) { //10
				res.status(500).send(err);
			});
		}
	});
};

FileDriver.prototype.handleImageUploadRequest = function(req,res){
	var type = req.get('content-type');
	var ext = type.substr(type.indexOf('/')+1);
	if (ext) {ext = '.' + ext; } else {ext = '';}
	var filename = __dirname + '/uploads/'+ Date.now() +ext;
	var writable = fs.createWriteStream(filename);
	req.pipe(writable);
	req.on('end', function (){
		res.status(201).send({'imagePath':filename});
	});
	writable.on('error', function(err) { //10
		res.status(500).send(err);
	});
}

exports.FileDriver = FileDriver;