const express = require('express');
const router = express.Router();
const authFunction = require('../functions/authFunction');
const usersFunction = require('../functions/usersFunction');
const mailFunction = require('../functions/mailFunction');

router.post('/login', authFunction.login);
router.post('/register', authFunction.register);
router.get("/verify", authFunction.verifyAccount);
router.get('/users', usersFunction.showFilteredUsers);
router.delete('/users/:id', usersFunction.deleteUser);
router.post('/users/rank', usersFunction.changeRanks);
router.post('/users/reset-password', usersFunction.resetPassword);
router.post("/users/changePassword", usersFunction.changePassword);
router.post("/users/changeDescription", usersFunction.changeDescription);
router.post("/users/deactivateUser", usersFunction.deactivateUser);
router.post("/users/changePaymentStatus", usersFunction.changePaymentStatus);
router.post("/users/changeUserData", usersFunction.changeUserData);
router.post("/users/send-email", mailFunction.sendEmail);
router.post("/users/sendForgotPasswordEmail", usersFunction.sendForgotPasswordEmail);
router.post("/users/resetPasswordToken", usersFunction.resetPasswordToken);



module.exports = router;