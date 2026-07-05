const express = require('express');
const router = express.Router();
const { getSupplyRecords, getSupplyRecordById, createSupplyRecord, updateSupplyStatus, deleteSupplyRecord } = require('../controllers/supplyController');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// Read access for all authenticated users
router.get('/', verifyToken, getSupplyRecords);
router.get('/:id', verifyToken, getSupplyRecordById);

// Write access (requires ADMIN or MANAGER)
router.post('/', verifyToken, authorizeRoles('ADMIN', 'MANAGER'), createSupplyRecord);
router.put('/:id/status', verifyToken, authorizeRoles('ADMIN', 'MANAGER'), updateSupplyStatus);

// Cancel/Delete access (requires ADMIN only)
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), deleteSupplyRecord);

module.exports = router;
