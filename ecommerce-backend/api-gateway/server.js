require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.GATEWAY_PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});
