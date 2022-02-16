const mysql = require("mysql2")

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1560",
    database: "car_dealership"
});

module.exports = connection;
