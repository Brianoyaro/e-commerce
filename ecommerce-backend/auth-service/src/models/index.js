const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const User = require('./user.model')(sequelize);

const db = {
  sequelize,
  Sequelize,
  User,
};

module.exports = db;
