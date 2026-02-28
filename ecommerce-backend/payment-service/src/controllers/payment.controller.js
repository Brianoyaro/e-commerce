const db = require('../models');
const Payment = db.Payment;
const mpesaService = require('../services/mpesa.service');
const stripeService = require('../services/stripe.service');
const axios = require('axios');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';

class PaymentController {
  // Initiate M-Pesa payment
  async initiateMpesaPayment(req, res, next) {
    try {
      const { orderId, phoneNumber, amount } = req.body;
      const userId = req.user.id;

      // Create payment record
      const payment = await Payment.create({
        orderId,
        userId,
        provider: 'mpesa',
        amount,
        currency: 'KES',
        phoneNumber,
        status: 'pending',
      });

      // Initiate STK Push
      const result = await mpesaService.initiateSTKPush(
        phoneNumber,
        amount,
        `ORDER-${orderId}`,
        'E-commerce Payment'
      );

      if (!result.success) {
        await payment.update({ status: 'failed', errorMessage: JSON.stringify(result.error) });
        return res.status(400).json({ error: 'Failed to initiate M-Pesa payment', details: result.error });
      }

      // Update payment with M-Pesa reference
      await payment.update({
        externalReference: result.checkoutRequestId,
        metadata: {
          merchantRequestId: result.merchantRequestId,
          checkoutRequestId: result.checkoutRequestId,
        },
        status: 'processing',
      });

      res.json({
        message: 'M-Pesa payment initiated. Please check your phone.',
        payment,
        checkoutRequestId: result.checkoutRequestId,
      });
    } catch (error) {
      next(error);
    }
  }

  // M-Pesa callback handler
  async mpesaCallback(req, res, next) {
    try {
      const { Body } = req.body;

      if (!Body || !Body.stkCallback) {
        return res.status(400).json({ error: 'Invalid callback data' });
      }

      const callback = Body.stkCallback;
      const checkoutRequestId = callback.CheckoutRequestID;
      const resultCode = callback.ResultCode;

      // Find payment by checkout request ID
      const payment = await Payment.findOne({
        where: { externalReference: checkoutRequestId },
      });

      if (!payment) {
        console.error('Payment not found for checkout request:', checkoutRequestId);
        return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      if (resultCode === 0) {
        // Payment successful
        const callbackMetadata = callback.CallbackMetadata?.Item || [];
        const mpesaReceiptNumber = callbackMetadata.find((item) => item.Name === 'MpesaReceiptNumber')?.Value;

        await payment.update({
          status: 'completed',
          transactionId: mpesaReceiptNumber,
          metadata: { ...payment.metadata, callback },
        });

        // Update order status
        await axios.post(`${ORDER_SERVICE_URL}/api/internal/update-status`, {
          orderId: payment.orderId,
          status: 'paid',
          paymentStatus: 'paid',
        });
      } else {
        // Payment failed
        await payment.update({
          status: 'failed',
          errorMessage: callback.ResultDesc,
          metadata: { ...payment.metadata, callback },
        });

        // Update order status
        await axios.post(`${ORDER_SERVICE_URL}/api/internal/update-status`, {
          orderId: payment.orderId,
          paymentStatus: 'failed',
        });
      }

      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error) {
      console.error('M-Pesa callback error:', error);
      res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
  }

  // Initiate Stripe payment
  async initiateStripePayment(req, res, next) {
    try {
      const { orderId, amount, currency = 'USD' } = req.body;
      const userId = req.user.id;

      // Create payment record
      const payment = await Payment.create({
        orderId,
        userId,
        provider: 'stripe',
        amount,
        currency: currency.toUpperCase(),
        status: 'pending',
      });

      // Create Stripe payment intent
      const result = await stripeService.createPaymentIntent(amount, currency, {
        orderId,
        userId,
        paymentId: payment.id,
      });

      if (!result.success) {
        await payment.update({ status: 'failed', errorMessage: result.error });
        return res.status(400).json({ error: 'Failed to create Stripe payment', details: result.error });
      }

      // Update payment with Stripe reference
      await payment.update({
        externalReference: result.paymentIntentId,
        status: 'processing',
      });

      res.json({
        message: 'Stripe payment initiated',
        payment,
        clientSecret: result.clientSecret,
      });
    } catch (error) {
      next(error);
    }
  }

  // Stripe webhook handler
  async stripeWebhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      const result = stripeService.verifyWebhookSignature(req.body, signature, webhookSecret);

      if (!result.success) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = result.event;

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Handle successful Stripe payment
  async handleStripePaymentSuccess(paymentIntent) {
    try {
      const payment = await Payment.findOne({
        where: { externalReference: paymentIntent.id },
      });

      if (!payment) {
        console.error('Payment not found for Stripe payment intent:', paymentIntent.id);
        return;
      }

      await payment.update({
        status: 'completed',
        transactionId: paymentIntent.id,
        metadata: { paymentIntent },
      });

      // Update order status
      await axios.post(`${ORDER_SERVICE_URL}/api/internal/update-status`, {
        orderId: payment.orderId,
        status: 'paid',
        paymentStatus: 'paid',
      });
    } catch (error) {
      console.error('Error handling Stripe payment success:', error);
    }
  }

  // Handle failed Stripe payment
  async handleStripePaymentFailed(paymentIntent) {
    try {
      const payment = await Payment.findOne({
        where: { externalReference: paymentIntent.id },
      });

      if (!payment) {
        console.error('Payment not found for Stripe payment intent:', paymentIntent.id);
        return;
      }

      await payment.update({
        status: 'failed',
        errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
        metadata: { paymentIntent },
      });

      // Update order status
      await axios.post(`${ORDER_SERVICE_URL}/api/internal/update-status`, {
        orderId: payment.orderId,
        paymentStatus: 'failed',
      });
    } catch (error) {
      console.error('Error handling Stripe payment failed:', error);
    }
  }

  // Get payment status
  async getPaymentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const payment = await Payment.findOne({
        where: { id, userId },
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      res.json({ payment });
    } catch (error) {
      next(error);
    }
  }

  // Get order payments
  async getOrderPayments(req, res, next) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const payments = await Payment.findAll({
        where: { orderId, userId },
        order: [['createdAt', 'DESC']],
      });

      res.json({ payments });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
