const { Resend } = require('resend');

exports.sendEmail = async (req, res) => {
    const { toWho, subject, content, html } = req.body;

    if (!toWho || !subject || (!content && !html)) {
        return res.status(400).json({ error: "Brak danych do wysyłki maila" });
    }

    console.log("📧 Próba wysłania maila do:", toWho);

    try {
        // Inicjalizacja Resend z API Key
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Wysyłka maila
        const data = await resend.emails.send({
            from: 'Szermierka Historyczna <onboarding@resend.dev>', // ✅ Domyślny adres (dopóki nie dodasz domeny)
            to: toWho,
            subject: subject,
            html: html || `<p>${content}</p>`,
        });

        console.log("✅ Mail wysłany! ID:", data.id);
        
        res.status(200).json({ 
            message: "Mail wysłany pomyślnie!",
            messageId: data.id 
        });

    } catch (err) {
        console.error("❌ Błąd wysyłki maila:");
        console.error("❌ Szczegóły:", err);
        
        res.status(500).json({ 
            error: "Nie udało się wysłać maila.",
            details: err.message
        });
    }
};