const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const Cart = require('./cart.model')(sequelize);
const CartItem = require('./cartItem.model')(sequelize);

// Define associations
Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

const db = {
  sequelize,
  Sequelize,
  Cart,
  CartItem,
};

module.exports = db;
