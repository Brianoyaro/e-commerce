const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PAYMENT_DB_NAME || 'payment_db',
  process.env.PAYMENT_DB_USER || 'postgres',
  process.env.PAYMENT_DB_PASSWORD || 'password',
  {
    host: process.env.PAYMENT_DB_HOST || 'payment-db',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
