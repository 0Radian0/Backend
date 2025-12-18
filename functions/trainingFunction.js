const trainingsModel = require('../queries/trainingsModel.js')      //Nie zmieniony

// Wyświetlanie filtrowanych rekordów
exports.showTrainingsTable = async (req, res) => {
    // Wstępnie ustawiono wyświetlanie tylko nowych treningów bez znaczenie czy mają opis czy nie
    const {
        newTrainings = 'true',
        trainingDescription = 'false',
        withoutDescription = 'false',
        tempSort = 'trainingDate',
        order = 'ASC',
        user = "all"
    } = req.query;

    const newTrainingsBool = newTrainings === 'true';
    const trainingDescriptionBool = trainingDescription === 'true';
    const withoutDescriptionBool = withoutDescription === 'true';

    const userNum = user === "all" ? "all" : Number(user);

    try {
        const trainings = await trainingsModel.getAllTraining(newTrainingsBool, trainingDescriptionBool, withoutDescriptionBool, tempSort, order, userNum);
        res.status(200).json(trainings);
    } catch (e) {
        console.log('Błąd serwera: ', e);
        res.status(500).json({ error: "Nie udało się utworzyć listy treningów" });
    }
}

// Usuwanie trenigów
exports.deleteTraining = async (req, res) => {
    const { trainingID } = req.params;

    if (!trainingID) return res.status(400).json({ error: "Nie wybrano treningu" })

    try {
        await trainingsModel.deleteTraining(trainingID);
        res.status(200).json({ success: true, message: "Trening został usunięty" })
    } catch (e) {
        console.log('Nie udało się usunąć treningu: ', e);
        res.status(500).json({ error: "Nie udało się usunąć treningu: " })
    }
}

// Dodawanie treninegu
exports.addTraining = async (req, res) => {
    const { date, place, details } = req.body;
    if (!date || !place)
        return res.status(400).json({ error: "Brak wymaganych danych" });

    try {
        const [result] = await trainingsModel.addTraining(date, place, details);
        const newTraining = {
            trainingID: result.insertId,
            trainingDate: date,
            trainingPlace: place,
            trainingDetails: details,
        };
        res.status(200).json({ success: true, message: "Trening został dodany", training: newTraining });
    } catch (e) {
        console.log('Nie udało się dodać treningu: ', e);
        res.status(500).json({ error: "Nie udało się dodać treningu: " });
    }
};

// Edytowanie treningu
exports.modifyTraining = async (req, res) => {
    const { date, place, details, id } = req.body;
    if (!date || !place || !id)
        return res.status(400).json({ error: "Brak wymaganych danych - nie można edytować treningu" });

    try {
        await trainingsModel.modifyTraining(date, place, details, id);
        res.status(200).json({
            success: true,
            message: "Dane treningu zostały zmienione"
        });
    } catch (e) {
        console.log('Nie udało się zmodyfikować treningu: ', e);
        res.status(500).json({ error: "Nie udało się zmodyfikować treningu: " });
    }
};

// Zapisywanie uczestnika na trening
exports.addUserToTraining = async (req, res) => {
    const { userID, trainingID } = req.body;

    if (!userID || !trainingID) return res.status(400).json({ error: "Brak wymaganych danych - nie można zapisać użytkownika na trening" });

    try {
        const tab = await trainingsModel.showAllTrainingParticipants(trainingID);
        const isAlreadySign = tab.some(p => p.userID === Number(userID));

        if (isAlreadySign) return res.status(400).json({ error: "Użytkownik jest już zapisany na trening" })

        await trainingsModel.addUserToTraining(userID, trainingID);
        res.status(200).json({
            success: true,
            message: "Użytkownik został dodany na trening"
        })
    } catch (e) {
        console.log("Nie udało się zapisać użytkownika na trening - backend");
        res.status(500).json({ error: "Nie udało się zapisać użytkownika na trening" })
    }
}

// wyświetlanie uczestników zapisanych na trening
exports.showAllTrainingParticipants = async (req, res) => {
    const { trainingID } = req.params;

    if (!trainingID) return res.status(400).json({ error: "Wybrany trening nie istnieje" });

    try {
        const participants = await trainingsModel.showAllTrainingParticipants(trainingID);
        res.status(200).json({
            success: true,
            message: "Wyświetlono uczestników treningu",
            data: participants
        })
    } catch (e) {
        console.log("Nie udało się wyświetlić uczestników treningu - backend");
        res.status(500).json({ error: "Nie udało się wyświetlić uczestników treningu" })
    }
}

// usuń uczestnika z treningu
exports.removeUserFromTraining = async (req, res) => {
    const { userID, trainingID  } = req.params;

    if (!userID || !trainingID ) return res.status(400).json({ error: "Ups. Brak wymaganych danych" });

    try {
        // Sprawdzenie czy użytkownik rzeczywiście jest zapisany na trening
        const [result] = await trainingsModel.removeUserFromTraining(userID, trainingID);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Uczestnik nie był zapisany na trening" });
        res.status(200).json({
            success: true,
            message: "Uczestnik został wypisany z treningu",
        })
    } catch (e) {
        console.log("Nie udało się usunąć uczestnika z treningu - backend", e);
        res.status(500).json({ error: "Nie udało się usunąć uczestnika z treningu" })
    }
}
