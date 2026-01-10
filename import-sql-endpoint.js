const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

router.post('/import-sql', async (req, res) => {
  try {
    // Połączenie z bazą Railway
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,       // z .env
      user: process.env.DB_USER,       // z .env
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,   // z .env
      port: process.env.DB_PORT || 3306
    });

    // Wczytaj plik SQL
    const filePath = path.join(__dirname, '../szermierka.sql'); // plik w katalogu wyżej
    const sql = fs.readFileSync(filePath, 'utf8');

    // Rozdziel zapytania po średniku i wykonaj każde
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const stmt of statements) {
      await connection.query(stmt);
    }

    await connection.end();
    console.log(' Plik szermierka.sql zaimportowany do Railway!');
    res.send(' Plik SQL zaimportowany do Railway!');
  } catch (err) {
    console.error(' Błąd importu SQL:', err);
    res.status(500).send(' Błąd importu SQL');
  }
});

module.exports = router;
