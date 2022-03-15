const express  = require('express');
const app  = express();

const authentication = require('./routes/Authentication')
app.use('/authentication',authentication);


module.exports = app;