const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const userModel = require('../queries/userModel');
const db = require('../config/db');
const { sendEmail } = require("./mailFunction");

// Dynamiczne URLe - pobierane ze zmiennych środowiskowych Railway
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('🔍 BACKEND_URL:', BACKEND_URL);
console.log('🔍 FRONTEND_URL:', FRONTEND_URL);

// Logowanie
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.getUserByEmail(email);
        if (!user) return res.status(401).json({ message: 'Wprowadzono niepoprawny email' });

        if (!user.verified) return res.status(403).json({ message: 'Konto nie zostało jeszcze aktywowane. Sprawdź e-mail i kliknij link aktywacyjny.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Wprowadzono niepoprawne hasło' });
        }

        const token = jwt.sign({ id: user.userID }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Ustawianie daty ostatniego logowania na dziś
        await userModel.setLastLogOnToday(user.userID);
        user.lastLog = new Date();

        // Dane do json
        return res.json({
            success: true,
            token,
            user: {
                userID: user.userID,
                email: user.email,
                registrationDate: user.registrationDate,
                lastLog: user.lastLog,
                description: user.description,
                rankID: user.rankID,
                deactivated: user.deactivated,
                name: user.name,
                surname: user.surname,
                paymentActive: user.paymentActive
            }
        });
    } catch (error) {
        console.error('Błąd logowania:', error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
};

// Rejestracja
exports.register = async (req, res) => {
    const { password, email, name, surname } = req.body;
    try {
        // walidacja
        const emailExists = await userModel.checkIfEmailExists(email);

        if (emailExists) return res.status(409).json({ message: 'Użytkownik z podanym emailem już istnieje' });
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: 'Proszę wprowadzić poprawny adres e-mail.' });
        const nameRegex = /^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:\s[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+){0,2}$/;
        if (!nameRegex.test(name)) return res.status(400).json({ message: 'Wprowadzone imię ma niepoprawny format' });
        const surnameRegex = /^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:[-\s][A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?$/;
        if (!surnameRegex.test(surname)) return res.status(400).json({ message: 'Wprowadzone nazwisko ma niepoprawny format' });
        const passwordRegex = /^.{8,255}$/;
        if (!passwordRegex.test(password)) return res.status(400).json({ message: 'Hasło musi spełniać wymogi bezpieczeństwa (co najmniej 8 znaków).' });

        // Hashowanie hasła
        const hashedPassword = await bcrypt.hash(password, 10);

        // Token do autoryzacji
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 godziny

        // DODANE: Tworzenie użytkownika w bazie danych
        await userModel.createUser(hashedPassword, email, name, surname, verificationToken, verificationExpires);

        // Link weryfikacyjny - używa BACKEND_URL ze zmiennych środowiskowych
        const verifyLink = `${BACKEND_URL}/api/auth/verify?token=${verificationToken}`;

        console.log('📧 Wysyłam mail weryfikacyjny na:', email);
        console.log('🔗 Link weryfikacyjny:', verifyLink);

        // Bezpośrednie wywołanie funkcji sendEmail
        await sendEmail({
            body: {
                toWho: email,
                subject: "Potwierdzenie rejestracji w Klubie Szermierki",
                html: `
                    <div style="font-family: Arial, sans-serif;">
                        <h3>Cześć ${name}!</h3>
                        <p>Dziękujemy za rejestrację w naszym klubie. Aby aktywować konto, kliknij poniższy link:</p>
                        <p><a href="${verifyLink}" style="color:#1a73e8;">Aktywuj konto</a></p>
                        <p>Link wygaśnie za 24 godziny.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p>Pozdrawiamy,<br>Klub Szermierki Historycznej przy Politechnice Lubelskiej</p>
                    </div>
                `
            }
        }, {
            status: (code) => ({
                json: (data) => {
                    if (code !== 200) {
                        throw new Error(data.error || 'Błąd wysyłki maila');
                    }
                }
            })
        });

        return res.json({
            success: true,
            message: "Utworzono użytkownika. Na podany przy rejestracji adres e-mail został wysłany link aktywacyjny. Link jest ważny 24 godziny."
        });

    } catch (err) {
        console.error('Błąd rejestracji:', err);
        return res.status(500).json({ message: 'Błąd serwera: ' + err.message });
    }
};

// Sprawdzenie czy użytkownik kliknął w link aktywacyjny
exports.verifyAccount = async (req, res) => {
    const { token } = req.query;

    if (!token) return res.status(400).json({ message: 'Brak tokenu weryfikacyjnego' });

    try {
        const user = await userModel.getUserToken(token);

        if (!user) return res.status(400).json({ message: "Nieprawidłowy token." });
        if (new Date(user.verificationExpires) < new Date()) {
            return res.status(400).json({ message: "Token wygasł. Poproś o nowy link aktywacyjny." });
        }

        // Aktywacja konta
        await userModel.verifyEmail(user.userID);

        console.log('Konto zweryfikowane, przekierowanie na:', `${FRONTEND_URL}/login?verified=true`);

        // Przekierowanie na frontend - używa FRONTEND_URL ze zmiennych środowiskowych
        return res.redirect(`${FRONTEND_URL}/login?verified=true`);

    } catch (err) {
        console.error("Błąd weryfikacji konta:", err);
        return res.status(500).json({ message: "Błąd serwera" });
    }
};