const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const Payment = require('./payment.model')(sequelize);

const db = {
  sequelize,
  Sequelize,
  Payment,
};

module.exports = db;
