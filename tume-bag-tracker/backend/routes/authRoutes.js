const express = require('express');
const router = express.Router();
const { register, login, logout, refresh, me } = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', verifyToken, me);

module.exports = router;
