require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importSQL() {
  try {
    // Połączenie z bazą Railway
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,       // np. mysql.railway.internal
      user: process.env.DB_USER,       // np. root
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,   // np. railway
      port: process.env.DB_PORT || 3306
    });

    // Wczytaj plik SQL
    const filePath = path.join(__dirname, '../szermierka.sql'); // plik w katalogu wyżej
    const sql = fs.readFileSync(filePath, 'utf8');

    // Rozdziel zapytania po średniku (;) i wykonaj każde
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const stmt of statements) {
      await connection.query(stmt);
    }

    console.log('✅ Plik szermierka.sql zaimportowany do Railway!');
    await connection.end();
  } catch (err) {
    console.error('❌ Błąd importu SQL:', err);
  }
}

importSQL();
