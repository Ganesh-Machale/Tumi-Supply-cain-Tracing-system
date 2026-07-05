const express = require('express');
const router = express.Router();
const { getInventory, getLowStock } = require('../controllers/inventoryController');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, getInventory);
router.get('/low-stock', verifyToken, getLowStock);

module.exports = router;
