const db = require("../config/db.js");

// Dodawanie loga o wysyłce maila
const addMailLog = async (toWho, mailSubject) => {
    return db.execute(`INSERT INTO maillogs (recipient, subject, sent_at) 
        VALUES (?, ?, CURRENT_DATE)`, [toWho, mailSubject]);
}

// Sprawdzanie ilości maili wysłanych danego dnia
const checkMailCount = async () => {
    return db.execute(`SELECT COUNT(*) AS mailCount
         FROM maillogs
         WHERE sent_at = CURRENT_DATE`);
};


module.exports = {
    addMailLog, checkMailCount
}