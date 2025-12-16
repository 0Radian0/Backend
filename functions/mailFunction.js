const nodemailer = require("nodemailer");

exports.sendEmail = async (req, res) => {
    const { toWho, subject, content, html } = req.body;

    if (!toWho || !subject || (!content && !html)) {
        return res.status(400).json({ error: "Brak danych do wysyłki maila" });
    }

    console.log("📧 Próba wysłania maila do:", toWho);
    console.log("📧 SMTP Config:", {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER
    });

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            // Dodatkowe opcje dla Gmaila
            tls: {
                rejectUnauthorized: false
            }
        });

        // Test połączenia
        await transporter.verify();
        console.log("✅ Połączenie SMTP OK");

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: toWho,
            subject,
            html,
            text: content,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Mail wysłany:", info.messageId);
        
        res.status(200).json({ message: "Mail wysłany pomyślnie!" });
    } catch (err) {
        console.error("❌ Błąd wysyłki maila:");
        console.error("❌ Kod błędu:", err.code);
        console.error("❌ Wiadomość:", err.message);
        console.error("❌ Pełny błąd:", err);
        
        res.status(500).json({ 
            error: "Nie udało się wysłać maila.",
            details: err.message // Dodaj szczegóły błędu dla debugowania
        });
    }
};