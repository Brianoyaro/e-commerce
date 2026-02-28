const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PRODUCT_DB_NAME || 'product_db',
  process.env.PRODUCT_DB_USER || 'postgres',
  process.env.PRODUCT_DB_PASSWORD || 'password',
  {
    host: process.env.PRODUCT_DB_HOST || 'product-db',
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
