const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const Order = require('./order.model')(sequelize);
const OrderItem = require('./orderItem.model')(sequelize);

// Define associations
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

const db = {
  sequelize,
  Sequelize,
  Order,
  OrderItem,
};

module.exports = db;
