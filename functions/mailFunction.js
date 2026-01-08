const { Resend } = require('resend'); 
const mailModel = require('../queries/mailModel.js');
const mailRestriction = 95; // limit dzienny

exports.sendEmail = async (req, res) => {
    const { toWho, subject, content, html } = req.body;

    if (!toWho || !subject || (!content && !html)) {
        return res.status(400).json({
            success: false,
            message: "Brak danych do wysyłki maila. Uzupełnij wszystkie wymagane pola."
        });
    }

    console.log("Próba wysłania maila do:", toWho);

    try {
        const resend = new Resend(process.env.RESEND_API_KEY); 

        // Sprawdzenie limitu dziennego
        const count = await mailModel.checkMailCount();
        const mailCount = count[0][0].mailCount;

        if (mailCount >= mailRestriction) {
            return res.status(400).json({
                success: false,
                message: "Nie można wysłać wiadomości e-mail. Przekroczono dzienny limit wysyłki. Spróbuj ponownie jutro."
            });
        }

        // Wysyłka maila
        const data = await resend.emails.send({
            from: 'Szermierka Historyczna <kontakt@szermierka.ovh>',
            to: toWho,
            subject: subject,
            html: html || `<p>${content}</p>`,
        });

        console.log("Mail wysłany! ID:", data.id);

        // Dodanie loga po wysyłce
        const result = await mailModel.addMailLog(toWho, subject);
        console.log("Mail log added:", result);

        res.status(200).json({
            success: true,
            message: "Mail wysłany pomyślnie!",
            messageId: data.id
        });

    } catch (err) {
        console.error("Błąd wysyłki maila:", err);

        res.status(500).json({
            success: false,
            message: "Nie udało się wysłać maila.",
            details: err.message
        });
    }
};
