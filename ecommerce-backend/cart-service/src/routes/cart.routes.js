const express = require('express');
const cartController = require('../controllers/cart.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protected routes
router.get('/cart', authMiddleware, cartController.getCart);
router.post('/cart/items', authMiddleware, cartController.addItem);
router.put('/cart/items/:itemId', authMiddleware, cartController.updateItem);
router.delete('/cart/items/:itemId', authMiddleware, cartController.removeItem);
router.delete('/cart', authMiddleware, cartController.clearCart);

// Internal service routes
router.post('/internal/cart/checkout', cartController.getCartForCheckout);

module.exports = router;
