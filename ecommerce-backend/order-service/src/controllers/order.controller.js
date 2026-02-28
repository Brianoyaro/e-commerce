const db = require('../models');
const Order = db.Order;
const OrderItem = db.OrderItem;
const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004';

class OrderController {
  // Create new order
  async createOrder(req, res, next) {
    const transaction = await db.sequelize.transaction();

    try {
      const { items, shippingAddress, notes } = req.body;
      const userId = req.user.id;

      // Check stock availability
      const stockCheck = await axios.post(`${PRODUCT_SERVICE_URL}/api/internal/check-stock`, {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      if (!stockCheck.data.available) {
        return res.status(400).json({
          error: 'Some items are out of stock',
          details: stockCheck.data.items.filter((item) => !item.available),
        });
      }

      // Calculate total
      const totalAmount = stockCheck.data.items.reduce(
        (sum, item) => sum + parseFloat(item.price) * items.find((i) => i.productId === item.productId).quantity,
        0
      );

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order
      const order = await Order.create(
        {
          userId,
          orderNumber,
          totalAmount,
          shippingAddress,
          notes,
        },
        { transaction }
      );

      // Create order items
      const orderItems = await Promise.all(
        stockCheck.data.items.map(async (stockItem) => {
          const requestedItem = items.find((i) => i.productId === stockItem.productId);
          return OrderItem.create(
            {
              orderId: order.id,
              productId: stockItem.productId,
              productName: requestedItem.productName || 'Product',
              quantity: requestedItem.quantity,
              price: stockItem.price,
              subtotal: parseFloat(stockItem.price) * requestedItem.quantity,
            },
            { transaction }
          );
        })
      );

      // Update stock
      await axios.post(`${PRODUCT_SERVICE_URL}/api/internal/update-stock`, {
        updates: items.map((item) => ({
          productId: item.productId,
          quantity: -item.quantity,
        })),
      });

      await transaction.commit();

      // Fetch complete order with items
      const completeOrder = await Order.findByPk(order.id, {
        include: [{ model: OrderItem, as: 'items' }],
      });

      res.status(201).json({
        message: 'Order created successfully',
        order: completeOrder,
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Get user orders
  async getUserOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await Order.findAndCountAll({
        where: { userId },
        include: [{ model: OrderItem, as: 'items' }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      res.json({
        orders: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalOrders: count,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single order
  async getOrder(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { id, userId },
        include: [{ model: OrderItem, as: 'items' }],
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ order });
    } catch (error) {
      next(error);
    }
  }

  // Update order status (internal service call)
  async updateOrderStatus(req, res, next) {
    try {
      const { orderId, status, paymentStatus } = req.body;

      const order = await Order.findByPk(orderId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const updates = {};
      if (status) updates.status = status;
      if (paymentStatus) updates.paymentStatus = paymentStatus;

      await order.update(updates);

      res.json({
        message: 'Order updated successfully',
        order,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel order
  async cancelOrder(req, res, next) {
    const transaction = await db.sequelize.transaction();

    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await Order.findOne({
        where: { id, userId },
        include: [{ model: OrderItem, as: 'items' }],
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ error: 'Order cannot be cancelled' });
      }

      // Restore stock
      await axios.post(`${PRODUCT_SERVICE_URL}/api/internal/update-stock`, {
        updates: order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      await order.update({ status: 'cancelled' }, { transaction });
      await transaction.commit();

      res.json({ message: 'Order cancelled successfully', order });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  // Get all orders (admin only)
  async getAllOrders(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;

      const { count, rows } = await Order.findAndCountAll({
        where,
        include: [{ model: OrderItem, as: 'items' }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      res.json({
        orders: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalOrders: count,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
