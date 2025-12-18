const db = require('../config/db.js');      //Do porpawy

// Wyświetlanie, sortowanie i filtrowanie treningów
const getAllTraining = async (
    newTrainings,
    trainingDescription,
    withoutDescription,
    tempSort = "trainingDate",
    order = "ASC",
    user = "all"
) => {
    const sortColumns = ["trainingPlace", "trainingDate", "trainingDetails"];

    if (!sortColumns.includes(tempSort)) tempSort = "trainingDate";
    if (!["ASC", "DESC"].includes(order.toUpperCase())) order = "ASC";

    let query = `
        SELECT DISTINCT t.* FROM trainings t
        LEFT JOIN signuptraining s ON s.trainingID = t.trainingID
    `;

    const cond = [];
    const args = [];

    // Filtr: tylko nadchodzące
    if (newTrainings) cond.push(`t.trainingDate > NOW()`);

    // Filtr: ma opis
    if (trainingDescription)
        cond.push(`t.trainingDetails IS NOT NULL AND t.trainingDetails <> ''`);

    // Filtr: nie ma opisu
    if (withoutDescription)
        cond.push(`(t.trainingDetails IS NULL OR t.trainingDetails = '')`);

    // Filtr: treningi użytkownika
    if (user !== "all") {
        cond.push(`s.userID = ?`);
        args.push(user);
    }

    if (cond.length > 0) query += " WHERE " + cond.join(" AND ");

    query += ` ORDER BY ${tempSort} ${order}`;

    const [rows] = await db.execute(query, args);
    return rows;
};


// Usuwanie treningu
const deleteTraining = async (trainingID) => {
    return db.execute(`DELETE FROM trainings WHERE trainingID = ?`, [trainingID]);
}

// Dodawanie treningu
const addTraining = async (date, place, details) => {
    return db.execute(`INSERT INTO trainings (trainingDate, trainingPlace, trainingDetails) 
        VALUES (?, ?, ?)`, [date, place, details]);
}

// Edycja treningu
const modifyTraining = async (date, place, details, id) => {
    return db.execute(`UPDATE trainings SET trainingDate = ?, trainingPlace = ?, trainingDetails = ? WHERE trainingID = ?`, [date, place, details, id])
}

// Zapisywanie użytkownika na trening
const addUserToTraining = async (userID, trainingID) => {
    return db.execute(`INSERT INTO signuptraining (userID, trainingID) VALUES (?, ?)`, [userID, trainingID]);
}

// Pokaż wszystkich uczestników treningu
const showAllTrainingParticipants = async (id) => {
    const [tab] = await db.execute(`SELECT s.userID, u.name, u.surname 
        FROM signuptraining s 
        JOIN users u on u.userID = s.userID
        WHERE s.trainingID = ?
        `, [id]);
    return tab;
}

// Wypisanie się z treningu
const removeUserFromTraining = async (userID, trainingID) => {
    return db.execute(`DELETE FROM signuptraining WHERE userID = ? AND trainingID = ?`, [userID, trainingID]);
}

module.exports = {
    getAllTraining, deleteTraining, addTraining, modifyTraining, addUserToTraining, showAllTrainingParticipants, removeUserFromTraining
}