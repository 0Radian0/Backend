const userModel = require('../queries/userModel');      //Nie zmieniony
const db = require('../config/db');
const express = require("express");
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require("./mailFunction");

function generateRandomPassword(length = 8) {
    let password = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    for (let i = 0; i < length; i++) {
        const rand = Math.floor(Math.random() * chars.length);
        password += chars[rand];
    }
    return password;
}

// Generowanie listy użytkowników
exports.showFilteredUsers = async (req, res) => {
    const { rank = 'all', tempSort = 'login', order = 'ASC', statusFilter = "all" } = req.query;

    try {
        const users = await userModel.filterUsers(rank === 'all' ? null : Number(rank), statusFilter, tempSort, order);
        res.status(200).json(users)
    } catch (e) {
        console.log('Błąd serwera: ', e);
        res.status(500).json({ error: "Nie udało się utworzyć listy użytkowników: " })
    }
}

// Usuwanie użytkownika
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        await userModel.deleteUser(id);
        res.status(200).json({ success: true, message: "Usunięto użytkownika" });
    } catch (e) {
        console.log("Nie udało się usunąć użytkownika: ", e);
        res.status(500).json({ error: "Błąd serwera przy usuwaniu użytkownika " });
    }
}

// Zmiana uprawnień
exports.changeRanks = async (req, res) => {
    const { rankID, userID } = req.body;
    try {
        await userModel.changeRanks(rankID, userID);
        res.status(200).json({ success: true, message: "Zmieniono uprawnienia użytkownika" });
    } catch (e) {
        console.log("Nie udało się zmienić uprawnień użytkownika: ", e);
        res.status(500).json({ error: "Nie udało się zmienić uprawnień użytkownika" })
    }
}

// Reset hasła
exports.resetPassword = async (req, res) => {
    const { userID } = req.body;
    if (!userID) return res.status(400).json({ error: "Taki użytkownik niestety nie istnieje" });
    const newPassword = generateRandomPassword();

    try {

        const user = await userModel.getUserByID(userID);
        if (!user) return res.status(404).json({ error: "Nie znaleziono użytkownika" });

        // Wysyłka maila przez endpoint
        await fetch("http://localhost:5000/api/users/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                toWho: user.email,
                subject: "Klub Szermierki Historycznej przy Politechnice Lubelskiej - reset hasła",
                html: `
                    <div style="font-family: Arial, sans-serif;">
                        <h3>Reset hasła</h3>
                        <p>Twoje hasło zostało pomyślnie zresetowane</p>
                        <p><strong>Nowe hasło użytkownika:</strong> ${newPassword}</p>
                        <p>Zaloguj się na swoje konto przy użyciu powyższego hasła.</p>
                        <p>Po zalogowaniu się do aplikacji zalecamy zmianę tego hasła w ustawieniach profilu.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p>Pozdrawiamy,<br>Klub Szermierki Historycznej przy Politechnice Lubelskiej</p>
                    </div>
                `
            })
        });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.resetPassword(userID, hashedPassword);

        res.status(200).json({ success: true, message: "Zresetowano hasło użytkownika. Odpowiednia wiadomość została wysłana na adres e-mail użytkownika" });
    } catch (e) {
        console.log("Nie udało się zresetować hasła: ", e);
        res.status(500).json({ error: "Nie można zresetować hasła" })
    }
}

// Zmiana hasła
exports.changePassword = async (req, res) => {
    const { userID, oldPassword, newPassword } = req.body;

    if (!userID) return res.status(400).json({ error: "Taki użytkownik niestety nie istnieje" });
    if (!newPassword || !oldPassword) return res.status(400).json({ error: "Brak wymaganych danych" });

    try {
        const user = await userModel.getUserByID(userID);
        if (!user) return res.status(400).json({ error: "Nie udało się odnaleźć takiego użytkownika :(" });
        if (!(await bcrypt.compare(oldPassword, user.password))) return res.status(401).json({ error: "Nieprawidłowe stare hasło" });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.resetPassword(userID, hashedPassword);
        res.status(200).json({ success: true, message: "Hasło zostało zmienione" });
    } catch (e) {
        console.error("Błąd przy zmianie hasła:", e);
        res.status(500).json({ error: "Nie udało się zmienić hasła" });
    }
}

// Zmiana opisu użytkownika
exports.changeDescription = async (req, res) => {
    const { userID, newDescription } = req.body;

    if (!userID) return res.status(400).json({ error: "Taki użytkownik niestety nie istnieje" });
    if (!newDescription) return res.status(400).json({ error: "Brak wymaganych danych" });
    try {
        const user = await userModel.getUserByID(userID);
        if (!user) return res.status(400).json({ error: "Nie udało się odnaleźć takiego użytkownika :(" });
        await userModel.changeDescription(userID, newDescription);
        res.status(200).json({ success: true, message: "Opis został zmieniony" });
    } catch (e) {
        console.error("Błąd przy zmianie opisu:", e);
        res.status(500).json({ error: "Nie udało się zmienić opisu użytkownika" });
    }
}

// Dezaktywowanie użytkownika
exports.deactivateUser = async (req, res) => {
    const { userID, deactivatedStatus } = req.body;
    const numStatus = Number(deactivatedStatus);

    if (!userID || isNaN(Number(userID))) return res.status(400).json({ error: "Wybrany użytkownik nie istnieje" });
    if (isNaN(numStatus) || ![0, 1].includes(numStatus)) return res.status(400).json({ error: "Nie można zmienić statusu użytkownika" });

    try {
        const user = await userModel.getUserByID(userID);
        if (!user) {
            return res.status(404).json({ error: "Nie udało się odnaleźć takiego użytkownika :(" });
        }

        await userModel.deactivateUser(userID, numStatus);
        return res.status(200).json({ success: true, message: "Status użytkownika został zmieniony" });
    } catch (e) {
        console.error("Błąd przy zmianie statusu użytkownika:", e);
        return res.status(500).json({ error: "Nie udało się zmienić statusu użytkownika" });
    }
};

//Wyłączanie użytkownika z opłat
exports.changePaymentStatus = async (req, res) => {
    const { userID, paymentActive } = req.body;

    const numStatus = Number(paymentActive);

    if (!userID || isNaN(Number(userID))) return res.status(400).json({ error: "Wybrany użytkownik nie istnieje" });
    if (isNaN(paymentActive) || ![0, 1].includes(numStatus)) return res.status(400).json({ error: "Nie można zmienić statusu płatności użytkownika" });

    try {
        const user = await userModel.getUserByID(userID);
        if (!user) return res.status(404).json({ error: "Nie udało się odnaleźć takiego użytkownika :(" });
        await userModel.changePaymentActive(userID, numStatus);
        return res.status(200).json({ success: true, message: "Status płatności użytkownika został zmieniony" });
    } catch (e) {
        console.error("Błąd przy zmianie statusu płatności użytkownika:", e);
        return res.status(500).json({ error: "Nie udało się zmienić statusu płatności użytkownika" });
    }

}

// Zmiana danych użytkownika
exports.changeUserData = async (req, res) => {
    const { login, email, name, surname, id } = req.body;

    if (!login || !email || !name || !surname || !id) return res.status(400).json({ error: "Brak wymganych danych - nie można zmienić danych użytkownika" });

    try {
        // Sprawdzenie czy podane dane już istnieją
        const currentUser = await userModel.getUserByID(id);
        if (!currentUser) return res.status(404).json({ error: "Użytkownik nie istnieje" });

        if (email !== currentUser.email) {
            const emailExists = await userModel.checkIfEmailExists(email);
            if (emailExists) return res.status(409).json({ error: 'Użytkownik z wprowadzonyn emailem już istnieje' });
        }

        if (login !== currentUser.login) {
            const loginExist = await userModel.checkIfLoginExists(login);
            if (loginExist) return res.status(409).json({ error: 'Użytkownik z wprowadzonyn loginem już istnieje' });
        }

        await userModel.changeUserData(id, login, email, name, surname);
        res.status(200).json({
            success: true,
            message: "Dane użytkownika zostały zmienione"
        })
    } catch (e) {
        console.log('Nie udało się zmienić danych użytkownika - BACKEND: ', e);
        res.status(500).json({ error: "Nie udało się zmienić danych użytkownika: " });
    }
}

// Wysłanie linku ze zmianą hasła
exports.sendForgotPasswordEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(404).json({ error: "Nie podano e-maila użytkownika" });
    if (!(await userModel.checkIfEmailExists(email)))
        return res.status(404).json({ error: "Użytkownik o podanym mailu nie istnieje" });

    try {
        // Token i data wygaśnięcia
        const resetPasswordToken = crypto.randomBytes(32).toString("hex");
        const resetPasswordExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // ustawienie terminu ważności tokenu na godzinę

        await userModel.createResetPasswordToken(email, resetPasswordToken, resetPasswordExpires);

        // Link weryfikacyjnydla użytkownika 
        const resetLink = `http://localhost:3000/resetPass/${resetPasswordToken}`;

        // Wysyłka maila przez endpoint
        await fetch("http://localhost:5000/api/users/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                toWho: email,
                subject: "Potwierdzenie resetu hasła użytkownika",
                html: `
                    <div style="font-family: Arial, sans-serif;">
                        <h3>Reset hasła do konta</h3>
                        <p>Otrzymaliśmy prośbę o zresetowanie hasła dla Twojego konta.</p>
                        <p>Aby ustawić nowe hasło, kliknij poniższy link:</p>
                        <p><a href="${resetLink}" style="color:#1a73e8;">Zresetuj hasło</a></p>
                        <p>Link będzie aktywny przez najbliższe <strong>24 godziny</strong>.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p>Jeśli nie prosiłeś o zmianę hasła, zignoruj tę wiadomość.</p>
                        <p>Pozdrawiamy,<br><strong>Klub Szermierki Historycznej przy Politechnice Lubelskiej</strong></p>
                    </div>
                `
            })
        });

        return res.json({
            success: true,
            message: "Na podany adres e-mail został wysłany link potwierdzający reset hasła. Po kliknięciu w link uzytkownik zostanie przełączony na stronę zmiany hasła"
        });

    } catch (e) {
        console.error("Błąd wysyłania maila resetującego:", e);
        res.status(500).json({ error: "Nie udało się wysłać maila weryfikującego e-mail do zmiany hasła użytkownika: " });
    }
}

// Resetowanie hasła po tokenie
exports.resetPasswordToken = async (req, res) => {
    const {token, newPassword} = req.body;
    if (!token) return res.status(404).json({ error: "URL nie zawiera poprawnego tokena" });

    try {
        const user = await userModel.getUserResetPasswordToken(token);
        if (!user) return res.status(400).json({ error: "Nie udało się odnaleźć użytkownika" });

        if (new Date(user.resetPasswordExpires) < new Date()) 
            return res.status(400).json({ error: "Token wygasł. Wygeneruj nowy link do resetu hasła." });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.resetPassword(user.userID, hashedPassword);

        await userModel.clearResetToken(user.userID);

        res.status(200).json({ success: true, message: "Hasło zostało zmienione" });
    } catch (e) {
        console.error("Błąd przy resetowaniu hasła:", e);
        res.status(500).json({ error: "Nie udało się zresetować hasła: " });
    }

}
