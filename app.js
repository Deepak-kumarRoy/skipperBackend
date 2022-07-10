const express  = require('express');
const app  = express();

const authentication = require('./routes/Authentication')
app.use('/authentication',authentication);

const api = require('./routes/api')
app.use('/api',api);


module.exports = app;