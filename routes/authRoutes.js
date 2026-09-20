const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated, ensureGuest } = require('../middleware/auth');

// Public Guest Routes
router.get('/login', ensureGuest, authController.getLogin);
router.post('/login', ensureGuest, authController.postLogin);
router.get('/register', ensureGuest, authController.getRegister);
router.post('/register', ensureGuest, authController.postRegister);

// Authenticated Routes
router.get('/logout', ensureAuthenticated, authController.getLogout);
router.get('/profile', ensureAuthenticated, authController.getProfile);
router.post('/profile', ensureAuthenticated, authController.postProfile);

module.exports = router;
