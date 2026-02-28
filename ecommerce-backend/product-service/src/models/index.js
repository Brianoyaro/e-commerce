const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const Product = require('./product.model')(sequelize);

const db = {
  sequelize,
  Sequelize,
  Product,
};

module.exports = db;
