require('dotenv').config();
const app = require('./src/app');
const db = require('./src/models');

const PORT = process.env.ORDER_PORT || 3003;

// Sync database and start server
db.sequelize
  .sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🛒 Order Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });
