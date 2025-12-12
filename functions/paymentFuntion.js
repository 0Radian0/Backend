const payModel = require('../queries/paymentsModel.js');

// podaje saldo płatności użytkownika
exports.getPaymentStatus = async (req, res) => {
    const { userID } = req.params;

    try {
        const paymentStatus = await payModel.getPaymentStatus(userID);
        res.status(200).json({ success: true, message: "Pobrano status płatności dla użytkownika", sumToPay: paymentStatus.sumToPay });
    } catch (e) {
        console.log("Błąd przy pobieraniu statusu płatności użytkownika: ", e)
        res.status(500).json({ error: "Błąd serwera przy pobieraniu danych" })
    }
}

// historia płatności
exports.getAllPaymentsByID = async (req, res) => {
    const {
        userID = null,
        paid = false,
        unpaid = false,
        afterDueTime = false,
        tempSort = "paymentDate",
        order = "ASC"
    } = req.query;

    const paidBool = paid === 'true';
    const unpaidBool = unpaid === 'true';
    const afterDueTimeBool = afterDueTime === 'true';

    try {
        const paymentsTab = await payModel.getAllPaymentsByID(userID, paidBool, unpaidBool, afterDueTimeBool, tempSort, order);
        res.status(200).json({ success: true, message: "Pobrano historię płatności", userPayments: paymentsTab })
    } catch (e) {
        console.log("Błąd podczas pobierania historii płatności użytkownika", e);
        res.status(500).json({ error: "Błąd serwera przy pobieraniu danych" })
    }
}

// Dodawanie pojedyńczej płatności
exports.addSinglePayment = async (req, res) => {
    const { paymentDate, dueDate, amount, userID } = req.body;
    if (!dueDate || userID == null || amount == null) return res.status(400).json({ error: "Brak wymaganych danych" });

    try {
        const [result] = await payModel.addSinglePayment(userID, paymentDate, dueDate, amount);
        const newPayment = {
            paymentID: result.insertId,
            paymentDate,
            dueDate,
            amount,
            userID
        };
        res.status(200).json({
            success: true,
            message: "Płatność została dodana",
            payment: newPayment
        });
    } catch (e) {
        console.error("Nie udało się dodać płatności: ", e);
        res.status(500).json({ error: "Nie udało się dodać płatności - BACKEND " });
    }
}

// Dodawanie płatności dla wszystkich użytkowników
exports.addMultiplePayments = async (req, res) => {
    const { paymentDate, dueDate, amount } = req.body;
    if (!dueDate || !amount) return res.status(400).json({ error: "Brak wymaganych danych" });

    try {
        const [result] = await payModel.addMultiplePayments(paymentDate, dueDate, amount);
        res.status(200).json({
            success: true,
            message: `Płatność została dodana dla ${result.affectedRows} użytkowników`
        });
    } catch (e) {
        console.error("Nie udało się dodać płatności: ", e);
        res.status(500).json({ error: "Nie udało się dodać płatności - BACKEND " });
    }
}

// Usuwanie opłaty
exports.deletePayment = async (req, res) => {
    const { paymentID } = req.params;
    if (!paymentID) return res.status(400).json({ error: "Nie wybrano płatności z listy" });
    try {
        await payModel.deletePayment(paymentID);
        res.status(200).json({ success: true, message: "Płatność została usunięta" })
    } catch (e) {
        console.log('Nie udało się usunąć płatności - BACKEND: ', e);
        res.status(500).json({ error: "Nie udało się usunąć płatności: " })
    }
}

// Opłacenie z datą dzisiejszą 
exports.setPaymentDateOnToday = async (req, res) => {
    const { paymentID } = req.params;
    if (!paymentID) return res.status(400).json({ error: "Nie wybrano płatności z listy" });
    try {
        await payModel.setPaymentDateOnToday(paymentID);
        res.status(200).json({ success: true, message: "Opłata została uiszczona" })
    } catch (e) {
        console.log('Nie udało się opłacić - BACKEND: ', e);
        res.status(500).json({ error: "Nie udało się opłacić: " })
    }
}

// Edycja płatności
exports.modifyPayment = async (req, res) => {
    const { paymentDate, dueDate, amount, id } = req.body;

    if (!id) return res.status(400).json({ error: "Nie wybrano płatności z listy" });
    if (!dueDate || !amount) return res.status(400).json({ error: "Brak wymaganych danych" });

    try {
        await payModel.modifyPayment(paymentDate, dueDate, amount, id);
        res.status(200).json({
            success: true,
            message: "Dane płatności zostały zmienione"
        });
    } catch (e) {
        console.log('Nie udało się zmodyfikować opłaty - BACKEND: ', e);
        res.status(500).json({ error: "Nie udało się zmodyfikować opłaty: " });
    }
}

// Wyświetlanie statusów poszczególnych użytkowników
exports.showUserPaymentStatus = async(req, res) => {
    try {
        const tab = await payModel.showUserPaymentStatus();
        res.status(200).json({
            success: true,
            message: "Dane płatności zostały pobrane",
            paymentsTab: tab
        });
    } catch (e) {
        console.log('Nie udało się pobrać statusów płatności użytkowników - BACKEND: ', e);
        res.status(500).json({ error: "Nie udało się pobrać statusów płatności użytkowników" });
    }
}