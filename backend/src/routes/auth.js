const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { signupValidation, loginValidation } = require('../validators/authValidator');
const { historyValidation } = require('../validators/historyValidator');

const router = express.Router();

router.post('/signup', signupValidation, authController.signup);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);
router.post('/history', authMiddleware, historyValidation, authController.addHistory);
router.get('/history', authMiddleware, authController.listHistory);

module.exports = router;
module.exports.authMiddleware = authMiddleware;
