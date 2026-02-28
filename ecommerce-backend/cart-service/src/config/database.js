const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.CART_DB_NAME || 'cart_db',
  process.env.CART_DB_USER || 'postgres',
  process.env.CART_DB_PASSWORD || 'password',
  {
    host: process.env.CART_DB_HOST || 'cart-db',
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
