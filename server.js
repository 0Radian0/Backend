require('dotenv').config();
console.log("SMTP_USER:", process.env.SMTP_USER);

const express = require('express');
const cors = require("cors");
const mysql = require('mysql2/promise'); 

const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');
const trainRoutes = require('./routes/trainings');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', paymentsRoutes);
app.use('/api', trainRoutes);

// ===============================
// [Railway] Dynamiczny port
// ===============================
const PORT = process.env.PORT || 5000;

// ===============================
// [Railway] Funkcja testująca połączenie z MySQL
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
    console.log("✅ Połączono z bazą danych!");
    await connection.end();
  } catch (err) {
    console.error("❌ Błąd połączenia z bazą danych:", err.message);
  }
}

// ===============================
// [Railway] Uruchomienie serwera
// ===============================
app.listen(PORT, async () => {
  console.log(`Serwer działa na porcie ${PORT}`);
  await testDatabaseConnection(); // test połączenia z DB przy starcie
});
