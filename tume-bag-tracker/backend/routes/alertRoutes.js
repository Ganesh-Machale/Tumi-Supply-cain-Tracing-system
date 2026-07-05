const express = require('express');
const router = express.Router();
const { getAlerts, markAsRead } = require('../controllers/alertController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, getAlerts);
router.put('/:id/read', verifyToken, markAsRead);

module.exports = router;
