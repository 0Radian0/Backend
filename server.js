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
// [Railway] Uruchomienie serwera
// ===============================
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
