const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.AUTH_DB_NAME || 'auth_db',
  process.env.AUTH_DB_USER || 'postgres',
  process.env.AUTH_DB_PASSWORD || 'password',
  {
    host: process.env.AUTH_DB_HOST || 'auth-db',
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
