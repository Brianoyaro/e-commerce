const stripe = require('../config/stripe');

class StripeService {
  // Create payment intent
  async createPaymentIntent(amount, currency, metadata) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe payment intent error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Retrieve payment intent
  async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        paymentIntent,
      };
    } catch (error) {
      console.error('Stripe retrieve error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create refund
  async createRefund(paymentIntentId, amount) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return {
        success: true,
        refund,
      };
    } catch (error) {
      console.error('Stripe refund error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature, secret) {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, secret);
      return {
        success: true,
        event,
      };
    } catch (error) {
      console.error('Stripe webhook verification error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new StripeService();
