const db = require('../models');
const Cart = db.Cart;
const CartItem = db.CartItem;
const axios = require('axios');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';

class CartController {
  // Get or create user cart
  async getCart(req, res, next) {
    try {
      const userId = req.user.id;

      let cart = await Cart.findOne({
        where: { userId },
        include: [{ model: CartItem, as: 'items' }],
      });

      // Create cart if doesn't exist
      if (!cart) {
        cart = await Cart.create({ userId });
        cart.items = [];
      }

      res.json({ cart });
    } catch (error) {
      next(error);
    }
  }

  // Add item to cart
  async addItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId, quantity = 1 } = req.body;

      // Get product details from product service
      let productData;
      try {
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
        productData = response.data.product;
      } catch (error) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check stock availability
      if (productData.stock < quantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock', 
          available: productData.stock 
        });
      }

      // Get or create cart
      let cart = await Cart.findOne({ where: { userId } });
      if (!cart) {
        cart = await Cart.create({ userId });
      }

      // Check if item already exists in cart
      let cartItem = await CartItem.findOne({
        where: { cartId: cart.id, productId },
      });

      if (cartItem) {
        // Update quantity
        const newQuantity = cartItem.quantity + quantity;
        
        if (productData.stock < newQuantity) {
          return res.status(400).json({ 
            error: 'Insufficient stock for requested quantity',
            available: productData.stock,
            currentInCart: cartItem.quantity
          });
        }

        cartItem.quantity = newQuantity;
        cartItem.subtotal = parseFloat(productData.price) * newQuantity;
        await cartItem.save();
      } else {
        // Add new item
        cartItem = await CartItem.create({
          cartId: cart.id,
          productId,
          productName: productData.name,
          price: productData.price,
          quantity,
          subtotal: parseFloat(productData.price) * quantity,
          imageUrl: productData.imageUrl,
        });
      }

      // Update cart totals
      await this.updateCartTotals(cart.id);

      // Get updated cart with items
      cart = await Cart.findByPk(cart.id, {
        include: [{ model: CartItem, as: 'items' }],
      });

      res.json({
        message: 'Item added to cart',
        cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update item quantity
  async updateItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;
      const { quantity } = req.body;

      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }

      // Get cart
      const cart = await Cart.findOne({ where: { userId } });
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }

      // Get cart item
      const cartItem = await CartItem.findOne({
        where: { id: itemId, cartId: cart.id },
      });

      if (!cartItem) {
        return res.status(404).json({ error: 'Item not found in cart' });
      }

      // Verify stock availability
      try {
        const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${cartItem.productId}`);
        const product = response.data.product;

        if (product.stock < quantity) {
          return res.status(400).json({ 
            error: 'Insufficient stock', 
            available: product.stock 
          });
        }

        // Update item
        cartItem.quantity = quantity;
        cartItem.price = product.price; // Update price in case it changed
        cartItem.subtotal = parseFloat(product.price) * quantity;
        await cartItem.save();
      } catch (error) {
        return res.status(404).json({ error: 'Product not found or unavailable' });
      }

      // Update cart totals
      await this.updateCartTotals(cart.id);

      // Get updated cart
      const updatedCart = await Cart.findByPk(cart.id, {
        include: [{ model: CartItem, as: 'items' }],
      });

      res.json({
        message: 'Cart item updated',
        cart: updatedCart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove item from cart
  async removeItem(req, res, next) {
    try {
      const userId = req.user.id;
      const { itemId } = req.params;

      // Get cart
      const cart = await Cart.findOne({ where: { userId } });
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }

      // Find and delete item
      const cartItem = await CartItem.findOne({
        where: { id: itemId, cartId: cart.id },
      });

      if (!cartItem) {
        return res.status(404).json({ error: 'Item not found in cart' });
      }

      await cartItem.destroy();

      // Update cart totals
      await this.updateCartTotals(cart.id);

      // Get updated cart
      const updatedCart = await Cart.findByPk(cart.id, {
        include: [{ model: CartItem, as: 'items' }],
      });

      res.json({
        message: 'Item removed from cart',
        cart: updatedCart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear cart
  async clearCart(req, res, next) {
    try {
      const userId = req.user.id;

      const cart = await Cart.findOne({ where: { userId } });
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found' });
      }

      // Delete all items
      await CartItem.destroy({ where: { cartId: cart.id } });

      // Update cart totals
      await cart.update({
        totalAmount: 0,
        itemCount: 0,
      });

      res.json({
        message: 'Cart cleared',
        cart,
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper: Update cart totals
  async updateCartTotals(cartId) {
    const items = await CartItem.findAll({ where: { cartId } });

    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    await Cart.update(
      { totalAmount, itemCount },
      { where: { id: cartId } }
    );
  }

  // Get cart for checkout (internal - used by order service)
  async getCartForCheckout(req, res, next) {
    try {
      const { userId } = req.body;

      const cart = await Cart.findOne({
        where: { userId },
        include: [{ model: CartItem, as: 'items' }],
      });

      if (!cart || cart.items.length === 0) {
        return res.status(404).json({ error: 'Cart is empty' });
      }

      res.json({ cart });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();
