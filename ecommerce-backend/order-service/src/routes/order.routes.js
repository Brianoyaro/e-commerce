const express = require('express');
const orderController = require('../controllers/order.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protected routes
router.post('/orders', authMiddleware, orderController.createOrder);
router.get('/orders', authMiddleware, orderController.getUserOrders);
router.get('/orders/:id', authMiddleware, orderController.getOrder);
router.put('/orders/:id/cancel', authMiddleware, orderController.cancelOrder);

// Admin routes
router.get('/admin/orders', authMiddleware, isAdmin, orderController.getAllOrders);

// Internal service routes
router.post('/internal/update-status', orderController.updateOrderStatus);

module.exports = router;
