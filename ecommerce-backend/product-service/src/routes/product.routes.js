const express = require('express');
const productController = require('../controllers/product.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProduct);

// Internal service routes
router.post('/internal/check-stock', productController.checkStock);
router.post('/internal/update-stock', productController.updateStock);

// Protected routes (admin only)
router.post('/products', authMiddleware, isAdmin, productController.createProduct);
router.put('/products/:id', authMiddleware, isAdmin, productController.updateProduct);
router.delete('/products/:id', authMiddleware, isAdmin, productController.deleteProduct);

module.exports = router;
