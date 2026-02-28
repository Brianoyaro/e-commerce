const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cartRoutes = require('./routes/cart.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Cart Service', timestamp: new Date() });
});

// Routes
app.use('/api', cartRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
