const db = require('../config/db');         //Do poprawy

// Zmiana danych użytkownika (email, imię, nazwisko)
const changeUserData = async (userID, email, name, surname) => {
    return db.execute(
        'UPDATE users SET email = ?, name = ?, surname = ? WHERE userID = ?',
        [email, name, surname, userID]
    );
};




// Pobranie danych użytkownika na podstawie emaila
const getUserByEmail = async (email) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

// Pobranie danych użytkownika na podstawie id
const getUserByID = async (userID) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE userID = ?', [userID]);
    return rows[0];
};



// Sprawdzenie czy istnieje taki mail w bazie
const checkIfEmailExists = async (email) => {
    const [rows] = await db.execute('SELECT userID  FROM users WHERE email = ?', [email])
    return rows.length > 0;
}

// Tworzenie użytkownika
const createUser = async (password, email, name, surname, token, expires) => {
    return db.execute(
        `INSERT INTO users (
            password, 
            email, 
            registrationDate, 
            lastLog, 
            description, 
            rankID, 
            deactivated, 
            name, 
            surname, 
            paymentActive, 
            verified, 
            verificationToken, 
            verificationExpires, 
            resetPasswordToken, 
            resetPasswordExpires
        ) VALUES (?, ?, NOW(), NOW(), NULL, 3, false, ?, ?, true, false, ?, ?, NULL, NULL)`,
        [password, email, name, surname, token, expires]
        // 1        2      3     4       5      6
    );
};

// Filtrowanie użytkowników
const filterUsers = async (rankID, statusFilter, tempSort = "name", order = "ASC") => {
    const sortColumns = [
        "registrationDate", "description", "lastLog",
        "rankID", "paymentActive", "deactivated", "sumToPay"
    ];

    if (!sortColumns.includes(tempSort)) tempSort = "name";
    if (!["ASC", "DESC"].includes(order.toUpperCase())) order = "ASC";

    let having = "";

    let query = `
        SELECT 
            u.*, 
            r.name AS rankName,
            MAX(p.paymentDate) AS lastPaymentDate,
            COALESCE(SUM(CASE WHEN p.paymentDate IS NULL THEN p.amount ELSE 0 END), 0) AS sumToPay
        FROM users AS u
        LEFT JOIN ranks r ON u.rankID = r.rankID
        LEFT JOIN payments p ON u.userID = p.userID
    `;

    const args = [];
    const conditions = [];

    // Filtrowanie po rankID
    if (rankID && rankID !== "all") {
        conditions.push(`u.rankID = ?`);
        args.push(rankID);
    }

    // Filtrowanie statusów
    if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "payActive")
            conditions.push(`u.paymentActive = 1`);
        else if (statusFilter === "payUnactive")
            conditions.push(`u.paymentActive = 0`);
        else if (statusFilter === "deactivated")
            conditions.push(`u.deactivated = 1`);
        else if (statusFilter === "active")
            conditions.push(`u.deactivated = 0`);
        else if (statusFilter === "lackOfPayment")
            having = `HAVING sumToPay > 0`;
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` GROUP BY u.userID `;

    if (having) query += ` ${having} `;

    query += ` ORDER BY ${tempSort} ${order}`;

    const [rows] = await db.execute(query, args);
    return rows;
};


// Usuwanie użytkownika
const deleteUser = async (id) => {
    await db.execute('DELETE FROM payments WHERE userID = ?', [id]);
    
    return db.execute('DELETE FROM users WHERE userID = ?', [id])
}

// Zmiana uprawnień
const changeRanks = async (rankID, userID) => {
    return db.execute('UPDATE users SET rankID = ? WHERE userID = ?', [rankID, userID]);
}

// Zmiana hasła
const resetPassword = async (userID, newPassword) => {
    return db.execute('UPDATE users SET password = ? WHERE userID = ?', [newPassword, userID]);
}

// Zmiana opisu użytkownika
const changeDescription = async (userID, newDesc) => {
    return db.execute('UPDATE users SET description = ? WHERE userID = ?', [newDesc, userID]);
}

// Dezaktywowanie użytkownika
const deactivateUser = async (userID, deactivatedStatus) => {
    return db.execute('UPDATE users SET deactivated = ? WHERE userID = ?', [deactivatedStatus, userID]);
};

// Wyłączanie użytkownika z płatności
const changePaymentActive = async (userID, paymentStatus) => {
    return db.execute('UPDATE users SET paymentActive = ? WHERE userID = ?', [paymentStatus, userID]);
};



// Ustalanie daty ostatniego logowania na dzień dzisiejszy
const setLastLogOnToday = async (userID) => {
    return db.execute('UPDATE users SET lastLog = NOW() WHERE userID = ?', [userID]);
}

// Wyszukiwanie użytkownika po tokenie
const getUserToken = async (token) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE verificationToken = ?', [token]);
    return rows[0];
}

// Skuteczne logowanie
const verifyEmail = async (userID) => {
    return db.query('UPDATE users SET verified = true, verificationToken = NULL, verificationExpires = NULL WHERE userID = ?', [userID]);
}

// Tworzenie tokena to resetu hasła
const createResetPasswordToken = async (email, token, expires) => {
    return db.query('UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?', [token, expires, email]);
}

// Wyszukiwanie użytkownika po tokenie
const getUserResetPasswordToken = async (token) => {
    const [rows] = await db.execute('SELECT * FROM users WHERE resetPasswordToken = ?', [token]);
    return rows[0];
}

// Czyszczenie miejsca po tokenie
const clearResetToken = async (id) => {
    return db.execute('UPDATE users SET resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE userID = ?', [id]);
}

module.exports = {
    getUserByEmail, getUserByID,  checkIfEmailExists,
    createUser, filterUsers, deleteUser, changeRanks, resetPassword,
    changeDescription, deactivateUser, changePaymentActive, changeUserData,
    setLastLogOnToday, getUserToken, verifyEmail, createResetPasswordToken,
    getUserResetPasswordToken, clearResetToken
};
