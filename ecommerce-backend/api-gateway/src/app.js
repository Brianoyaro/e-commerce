const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimiter = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'API Gateway', timestamp: new Date() });
});

// Service routes with proxy
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  products: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  cart: process.env.CART_SERVICE_URL || 'http://cart-service:3005',
  orders: process.env.ORDER_SERVICE_URL || 'http://order-service:3003',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004',
};

// Proxy configurations
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: services.auth,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/api' },
    onError: (err, req, res) => {
      console.error('Auth service proxy error:', err);
      res.status(503).json({ error: 'Auth service unavailable' });
    },
  })
);

app.use(
  '/api/products',
  createProxyMiddleware({
    target: services.products,
    changeOrigin: true,
    pathRewrite: { '^/api/products': '/api' },
    onError: (err, req, res) => {
      console.error('Product service proxy error:', err);
      res.status(503).json({ error: 'Product service unavailable' });
    },
  })
);

app.use(
  '/api/cart',
  createProxyMiddleware({
    target: services.cart,
    changeOrigin: true,
    pathRewrite: { '^/api/cart': '/api' },
    onError: (err, req, res) => {
      console.error('Cart service proxy error:', err);
      res.status(503).json({ error: 'Cart service unavailable' });
    },
  })
);

app.use(
  '/api/orders',
  createProxyMiddleware({
    target: services.orders,
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '/api' },
    onError: (err, req, res) => {
      console.error('Order service proxy error:', err);
      res.status(503).json({ error: 'Order service unavailable' });
    },
  })
);

app.use(
  '/api/payments',
  createProxyMiddleware({
    target: services.payments,
    changeOrigin: true,
    pathRewrite: { '^/api/payments': '/api' },
    onError: (err, req, res) => {
      console.error('Payment service proxy error:', err);
      res.status(503).json({ error: 'Payment service unavailable' });
    },
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
