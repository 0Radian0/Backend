const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'szermierka',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

module.exports = connection;
