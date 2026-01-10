const mysql = require('mysql2/promise');                //Zatwierdzony

//  Używamy zmiennych środowiskowych z Railway (lub lokalnie z .env)
const connection = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'szermierka',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

// Test połączenia przy starcie
connection.getConnection()
    .then(conn => {
        console.log(' Połączono z bazą danych MySQL');
        conn.release();
    })
    .catch(err => {
        console.error(' Błąd połączenia z bazą danych:', err.message);
    });

module.exports = connection;