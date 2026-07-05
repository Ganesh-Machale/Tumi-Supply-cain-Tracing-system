const express = require('express');
const router = express.Router();
const { getLocations, getLocationById, createLocation, updateLocation } = require('../controllers/locationController');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// Read access for all authenticated users
router.get('/', verifyToken, getLocations);
router.get('/:id', verifyToken, getLocationById);

// Admin-only write access
router.post('/', verifyToken, authorizeRoles('ADMIN'), createLocation);
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), updateLocation);

module.exports = router;
