const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.ORDER_DB_NAME || 'order_db',
  process.env.ORDER_DB_USER || 'postgres',
  process.env.ORDER_DB_PASSWORD || 'password',
  {
    host: process.env.ORDER_DB_HOST || 'order-db',
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
