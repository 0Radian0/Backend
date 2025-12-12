const nodemailer = require("nodemailer");

exports.sendEmail = async (req, res) => {
    const { toWho, subject, content, html } = req.body;

    if (!toWho || !subject || (!content && !html)) return res.status(400).json({ error: "Brak danych do wysyłki maila" });

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: toWho,
            subject,
            html,
            text: content,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Mail wysłany pomyślnie!" });
    } catch (err) {
        console.error("Błąd wysyłki maila:", err);
        res.status(500).json({ error: "Nie udało się wysłać maila." });
    }
};
