const express = require('express');
const router = express.Router();
const payFunc = require('../functions/paymentFuntion');

router.get('/paymentStatus/:userID', payFunc.getPaymentStatus);
router.get('/getAllPaymentsByID', payFunc.getAllPaymentsByID);
router.post('/addSinglePayment', payFunc.addSinglePayment);
router.post('/addMultiplePayments', payFunc.addMultiplePayments);
router.delete('/deletePayment/:paymentID', payFunc.deletePayment);
router.put('/setPaymentDateOnToday/:paymentID', payFunc.setPaymentDateOnToday);
router.put('/modifyPayment', payFunc.modifyPayment);
router.get('/showUserPaymentStatus', payFunc.showUserPaymentStatus);
module.exports = router;