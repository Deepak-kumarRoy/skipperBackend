const cors = require('cors')
const express = require("express")
const bodyParser = require('body-parser');
var typeorm = require("typeorm"); var EntitySchema = typeorm.EntitySchema;
const http = require('http');
const app  = require('./app');

app.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],

}))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

var connection = typeorm.createConnection({
    "type": "postgres",
    "host": "localhost",
    "port": 5432,
    "username": "postgres",
    "password": "postgres",
    "database": "workflow",
    "synchronize": false,
    "logging": false,
    entities: [
        new EntitySchema(require("./entities/users.json")),
        new EntitySchema(require("./entities/menu.json")),
        new EntitySchema(require("./entities/submenu.json")),
        new EntitySchema(require("./entities/role_menu_mapping.json")),
        new EntitySchema(require("./entities/user_role_mapping.json"))
    ]
}).then(function (connection) {

    const server =http.createServer(app);
    server.listen(5000);
    console.log("server started")

}).catch(function (error) {
    console.log("Error: ", error)
    return;
});

module.exports = connection;