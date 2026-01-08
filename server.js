require('dotenv').config();
console.log("SMTP_USER:", process.env.SMTP_USER);

const express = require('express');
const cors = require("cors");
const mysql = require('mysql2/promise'); 

const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');
const trainRoutes = require('./routes/trainings');

// ===============================
// [Railway] Tymczasowy endpoint importu SQL
// ===============================
const importSQLRouter = require('./import-sql-endpoint');

// ===============================
// [Railway] Tymczasowy endpoint testowy do sprawdzenia tabel
// ===============================
const testDBRouter = require('./routes/testdb');

const app = express();

/**
 * ===============================
 * CORS – POZWALAMY TYLKO NA FRONTEND Z NETLIFY
 * ===============================
 * Dzięki temu React (Netlify) może komunikować się z API (Railway)
 * a przeglądarka nie zablokuje requestów
 */

app.use((req, res, next) => {
  console.log("➡️", req.method, req.originalUrl);
  next();
});



// app.use(cors({
//   origin: "http://localhost:3000",
//   methods: ["GET","POST","PUT","DELETE","OPTIONS"],
//   allowedHeaders: ["Content-Type","Authorization"],
//   credentials: true
// }));

app.use(cors({
  origin: "https://szermierka-historyczna-lublin.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

/**
 * ===============================
 * Middleware do JSON
 * ===============================
 */
app.use(express.json());

// ===============================
// Rejestracja głównych routów API
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/trainings', trainRoutes);

// ===============================
// Tymczasowe endpointy Railway
// ===============================
app.use('/api/import', importSQLRouter);      // import SQL
app.use('/api/testdb', testDBRouter);         // test połączenia i listy tabel

// ===============================
// Dynamiczny port (Railway / lokalnie)
// ===============================
const PORT = process.env.PORT || 5000;

// ===============================
// Test połączenia z bazą danych MySQL
// ===============================
async function testDatabaseConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    console.log("Połączono z bazą danych!");
    await connection.end();
  } catch (err) {
    console.error("Błąd połączenia z bazą danych:", err.message);
  }
}

// ===============================
// Uruchomienie serwera
// ===============================
app.listen(PORT, async () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
  await testDatabaseConnection(); // test DB przy starcie
});
