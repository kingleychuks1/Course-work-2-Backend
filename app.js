const express = require('express');
var app = express();
const path = require("path");
const fs = require("fs");
var cors = require('cors');


app.use(cors())
app.use(express.json({limit: '50mb'}));



//Logger Middleware
app.use(function (req, res, next) {
    console.log("Request URL: " + req.url);
    console.log("Request Date: " + new Date());
    next();
});

//File Handler Middleware
app.use(function (req, res, next) {
    // Uses path.join to find the path where the file should be
    var filePath = path.join(__dirname, 'static', req.url);
    // Built-in fs.stat gets info about a file
    fs.stat(filePath, function (err, fileInfo) {
        if (err) {
            next();
            return;
        }
        if (fileInfo.isFile()) res.sendFile(filePath);
        else next();
    });
});


const {MongoClient} = require("mongodb");
const ObjectID = require('mongodb').ObjectId;
const uri = "mongodb+srv://WebstoreUser:webstorecw2@webstorecluster0.fek9jms.mongodb.net/Webstore?retryWrites=true&w=majority"
let db;


//Mongo Db Connections Driver
MongoClient.connect(uri, (err, client) => {
    if(!err){
        db = client.db('webstore');
        console.log("Connected Successfully!")
    }else{
        console.log(err);
    }
});



app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName);
    return next()
});

//Default Route
app.get('/', (req, res, next) => {
    res.send('Select a collection, e.g., /collection/messages');
});


//Fetch All Lessons Route GET
app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
});

//Create Lessons Route POST
app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insertOne(req.body, (e, results) => {
        if (e) return next(e);
        console.log(results.ops);
        res.send(results.ops)
    })
})

//UPDATE Lesson Route PUT
app.put('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.update(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' })
        })
})

//Query Backend For Lesson GET
app.get('/collection/:collectionName/:query', (req, res, next) => {

const query = {"$or": [
    {'subject': {'$regex': req.params.query, '$options': 'i'}},
    {'location': {'$regex': req.params.query, '$options': 'i'}}
]};

   
req.collection.find(query).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
});

//Error Handler Middleware
app.use(function (req, res) {
    res.status(404);
    res.send("File not found!");
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("App is listening on port 3000");
});
