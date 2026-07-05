const express = require('express');
const router = express.Router();
const { getUsers, changeRole, toggleDeactivate, changePassword } = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// Profile actions (authenticated users)
router.put('/change-password', verifyToken, changePassword);

// User list and moderation (ADMIN only)
router.get('/', verifyToken, authorizeRoles('ADMIN'), getUsers);
router.put('/:id/role', verifyToken, authorizeRoles('ADMIN'), changeRole);
router.put('/:id/deactivate', verifyToken, authorizeRoles('ADMIN'), toggleDeactivate);

module.exports = router;
