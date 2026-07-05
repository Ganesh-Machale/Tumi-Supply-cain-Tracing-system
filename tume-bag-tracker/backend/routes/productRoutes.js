const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const verifyToken = require('../middleware/verifyToken');
const authorizeRoles = require('../middleware/authorizeRoles');

// Public to all authenticated users
router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, getProductById);

// Restricted roles
router.post('/', verifyToken, authorizeRoles('ADMIN', 'MANAGER'), createProduct);
router.put('/:id', verifyToken, authorizeRoles('ADMIN', 'MANAGER'), updateProduct);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), deleteProduct);

module.exports = router;
