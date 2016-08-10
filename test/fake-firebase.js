/**
 * Created by austin on 8/10/16.
 * @file Creates a new instance of a firebase test server
 */


const FirebaseServer = require('firebase-server');
const testData = require('./testdata.json');

module.exports = new FirebaseServer(5001, 'localhost:5001', testData);
