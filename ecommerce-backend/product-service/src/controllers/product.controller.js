const db = require('../models');
const Product = db.Product;
const { Op } = require('sequelize');

class ProductController {
  // Get all products with pagination and filtering
  async getProducts(req, res, next) {
    try {
      const { page = 1, limit = 10, category, search, minPrice, maxPrice } = req.query;
      const offset = (page - 1) * limit;

      const where = { isActive: true };

      if (category) {
        where.category = category;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = minPrice;
        if (maxPrice) where.price[Op.lte] = maxPrice;
      }

      const { count, rows } = await Product.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      res.json({
        products: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalProducts: count,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single product
  async getProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  // Create product (admin only)
  async createProduct(req, res, next) {
    try {
      const productData = req.body;
      const product = await Product.create(productData);

      res.status(201).json({
        message: 'Product created successfully',
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update product (admin only)
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await product.update(req.body);

      res.json({
        message: 'Product updated successfully',
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete product (admin only - soft delete)
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const product = await Product.findByPk(id);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await product.update({ isActive: false });

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Update stock (internal service call)
  async updateStock(req, res, next) {
    try {
      const { productId, quantity } = req.body;
      const product = await Product.findByPk(productId);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (product.stock < Math.abs(quantity) && quantity < 0) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      await product.update({ stock: product.stock + quantity });

      res.json({
        message: 'Stock updated successfully',
        product,
      });
    } catch (error) {
      next(error);
    }
  }

  // Check stock availability (internal service call)
  async checkStock(req, res, next) {
    try {
      const { items } = req.body; // [{ productId, quantity }]

      const productIds = items.map((item) => item.productId);
      const products = await Product.findAll({
        where: { id: productIds, isActive: true },
      });

      const results = items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        
        if (!product) {
          return {
            productId: item.productId,
            available: false,
            error: 'Product not found',
          };
        }

        if (product.stock < item.quantity) {
          return {
            productId: item.productId,
            available: false,
            error: 'Insufficient stock',
            requested: item.quantity,
            available: product.stock,
          };
        }

        return {
          productId: item.productId,
          available: true,
          stock: product.stock,
          price: product.price,
        };
      });

      const allAvailable = results.every((r) => r.available);

      res.json({
        available: allAvailable,
        items: results,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
