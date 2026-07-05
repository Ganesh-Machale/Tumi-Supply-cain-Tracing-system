const express = require('express');
const router = express.Router();
const { getSummary, getByRegion, getByProduct, getByStatus, getTrend, exportCsv } = require('../controllers/reportController');
const verifyToken = require('../middleware/verifyToken');

router.get('/summary', verifyToken, getSummary);
router.get('/by-region', verifyToken, getByRegion);
router.get('/by-product', verifyToken, getByProduct);
router.get('/by-status', verifyToken, getByStatus);
router.get('/trend', verifyToken, getTrend);
router.get('/export', verifyToken, exportCsv);

module.exports = router;
