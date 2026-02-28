const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Protected routes
router.post('/payments/mpesa', authMiddleware, paymentController.initiateMpesaPayment);
router.post('/payments/stripe', authMiddleware, paymentController.initiateStripePayment);
router.get('/payments/:id', authMiddleware, paymentController.getPaymentStatus);
router.get('/payments/order/:orderId', authMiddleware, paymentController.getOrderPayments);

// Webhook routes (no auth required - verified by signature)
router.post('/webhook/mpesa', paymentController.mpesaCallback);
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

module.exports = router;
