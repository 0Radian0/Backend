const db = require('../config/db');

// Wyświetlanie salda płatności dla użytkownika
const getPaymentStatus = async (userID) => {
    const [tab] = await db.execute('SELECT COALESCE(SUM(amount), 0) as sumToPay FROM payments WHERE userID = ? AND (paymentDate IS NULL)', [userID]);
    return tab[0];
}

// Historia płatności wszystkich użytkowników
const getAllPaymentsByID = async (userID, paid = false, unpaid = true, afterDueTime = true, tempSort = "paymentDate", order = "ASC") => {
    const sortColumns = ["paymentDate", "dueDate", "amount"];

    if (!sortColumns.includes(tempSort)) tempSort = "paymentDate";
    if (!["ASC", "DESC"].includes(order.toUpperCase())) order = "ASC";

    let query = `SELECT * FROM payments`;
    let cond = [];
    let params = [];

    if (paid) cond.push(`paymentDate IS NOT NULL`);
    if (unpaid) cond.push(`paymentDate IS NULL`);
    if (afterDueTime) cond.push(`paymentDate IS NULL AND dueDate < NOW()`);
    if (userID) {
        cond.push(`userID = ?`);
        params.push(userID);
    }

    if (cond.length > 0) query += " WHERE " + cond.join(" AND ");
    query += ` ORDER BY ${tempSort} ${order}`;

    const [tab] = await db.execute(query, params);
    return tab;
}

// Dodanie pojedyńczej płatności dla pojedyńczego użytkownika
const addSinglePayment = async (userID, paymentDate, dueDate, amount) => {
    return db.execute(
        `INSERT INTO payments (paymentDate, dueDate, amount, userID) VALUES (?, ?, ?, ?)`,
        [paymentDate, dueDate, amount, userID]
    );
};

// Dodanie płatności dla wszystkich użytkowników
const addMultiplePayments = async (paymentDate, dueDate, amount) => {
    return db.execute(`INSERT INTO payments (paymentDate, dueDate, amount, userID)
        SELECT ?, ?, ?, userID
        FROM users;`, [paymentDate, dueDate, amount]);
}

// Usuwanie płatności
const deletePayment = async (id) => {
    return db.execute(`DELETE FROM payments WHERE paymentID = ?`, [id]);
}

// Ustalanie spłaty na dziś
const setPaymentDateOnToday = async (id) => {
    return db.execute(`UPDATE payments SET paymentDate = NOW() WHERE paymentID = ?`, [id]);
}

// Modyfikowanie szczegółów płatności
const modifyPayment = async (paymentDate, dueDate, amount, id) => {
    return db.execute(`UPDATE payments SET paymentDate = ?, dueDate = ?, amount = ? WHERE paymentID = ?`, [paymentDate, dueDate, amount, id]);
}

//  
const showUserPaymentStatus = async () => {
    const [tab] = await db.execute(`
        SELECT 
            u.userID,
            u.name,
            u.surname,
            u.email,
            COALESCE(SUM(CASE WHEN p.paymentDate IS NULL THEN p.amount ELSE 0 END), 0) AS sumToPay,
            MAX(p.paymentDate) AS lastPaymentDate
        FROM users u
        LEFT JOIN payments p ON u.userID = p.userID
        GROUP BY u.userID, u.name, u.surname, u.email
        ORDER BY COALESCE(SUM(CASE WHEN p.paymentDate IS NULL THEN p.amount ELSE 0 END), 0) DESC,
            MAX(p.paymentDate) ASC
    `);
    return tab;
}

module.exports = {
    getPaymentStatus, 
    getAllPaymentsByID, 
    addMultiplePayments, 
    addSinglePayment, 
    deletePayment, 
    setPaymentDateOnToday, 
    modifyPayment, 
    showUserPaymentStatus
}