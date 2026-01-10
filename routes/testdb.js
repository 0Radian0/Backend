const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

router.get('/', async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    const [rows] = await connection.query("SHOW TABLES;");
    await connection.end();
    res.json({ tables: rows });
  } catch (err) {
    res.status(500).send(` Błąd połączenia lub brak tabel: ${err.message}`);
  }
});

module.exports = router;
