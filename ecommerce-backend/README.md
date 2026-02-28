# 🛒 E-Commerce Backend - Microservices Architecture

A production-ready e-commerce backend built with **Node.js**, **Express**, **Sequelize**, **PostgreSQL**, **M-Pesa**, and **Stripe** payment integrations. Fully containerized with **Docker** and designed as microservices from day one.

## 🏗️ Architecture Overview

```
ecommerce-backend/
├── api-gateway/          # API Gateway & Routing
├── auth-service/         # Authentication & User Management
├── product-service/      # Product Catalog Management
├── cart-service/         # Shopping Cart Management
├── order-service/        # Order Processing & Management
├── payment-service/      # Payment Processing (M-Pesa + Stripe)
├── docker-compose.yml    # Docker orchestration
└── .env.example          # Environment variables template
```

## 🚀 Technology Stack

### Core Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for PostgreSQL
- **PostgreSQL** - Database (separate DB per service)
- **Docker & Docker Compose** - Containerization

### Payment Providers
- **M-Pesa (Safaricom)** - Mobile money (Kenya)
- **Stripe** - International card payments

### API Architecture
- **Microservices** - Independent, scalable services
- **API Gateway** - Single entry point with routing
- **Service-to-Service Communication** - HTTP/REST

## 📋 Prerequisites

- Docker & Docker Compose (recommended)
- Node.js 20+ (for local development)
- PostgreSQL 15+ (if running without Docker)
- M-Pesa Developer Account (https://developer.safaricom.co.ke/)
- Stripe Account (https://stripe.com/)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ecommerce-backend
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:

#### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=7d
```

#### Stripe Configuration
Get your keys from: https://dashboard.stripe.com/apikeys
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### M-Pesa Configuration
Get credentials from: https://developer.safaricom.co.ke/
```env
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_mpesa_passkey
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/webhook/mpesa
```

> **Note**: For local M-Pesa testing, use [ngrok](https://ngrok.com/) to expose your local server:
> ```bash
> ngrok http 5000
> # Use the ngrok URL for MPESA_CALLBACK_URL
> ```

### 3. Start Services with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 4. Verify Services

All services should be running:

- **API Gateway**: http://localhost:5000
- **Auth Service**: http://localhost:3001
- **Product Service**: http://localhost:3002
- **Cart Service**: http://localhost:3005
- **Order Service**: http://localhost:3003
- **Payment Service**: http://localhost:3004

Check health:
```bash
curl http://localhost:5000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3005/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

## 📡 API Endpoints

All requests go through the API Gateway (http://localhost:5000).

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |

### Products (`/api/products`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products (paginated) | No |
| GET | `/api/products/:id` | Get single product | No |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |

### Cart (`/api/cart`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cart` | Get user cart | Yes |
| POST | `/api/cart/items` | Add item to cart | Yes |
| PUT | `/api/cart/items/:itemId` | Update item quantity | Yes |
| DELETE | `/api/cart/items/:itemId` | Remove item from cart | Yes |
| DELETE | `/api/cart` | Clear cart | Yes |

### Orders (`/api/orders`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/orders` | Create order | Yes |
| GET | `/api/orders` | Get user orders | Yes |
| GET | `/api/orders/:id` | Get single order | Yes |
| PUT | `/api/orders/:id/cancel` | Cancel order | Yes |

### Payments (`/api/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/mpesa` | Initiate M-Pesa payment | Yes |
| POST | `/api/payments/stripe` | Initiate Stripe payment | Yes |
| GET | `/api/payments/:id` | Get payment status | Yes |
| GET | `/api/payments/order/:orderId` | Get order payments | Yes |

## 📝 Example API Usage

### 1. Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phoneNumber": "254712345678"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Create Product (Admin)

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone",
    "price": 150000,
    "stock": 50,
    "category": "Electronics",
    "sku": "IP15PRO-001"
  }'
```

### 4. Add Item to Cart

```bash
curl -X POST http://localhost:5000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "product-uuid-here",
    "quantity": 1
  }'
```

### 5. Get Cart

```bash
curl -X GET http://localhost:5000/api/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Create Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [
      {
        "productId": "uuid-here",
        "productName": "iPhone 15 Pro",
        "quantity": 1
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Nairobi",
      "country": "Kenya",
      "postalCode": "00100"
    }
  }'
```

### 7. Pay with M-Pesa

```bash
curl -X POST http://localhost:5000/api/payments/mpesa \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "order-uuid-here",
    "phoneNumber": "254712345678",
    "amount": 150000
  }'
```

### 8. Pay with Stripe

```bash
curl -X POST http://localhost:5000/api/payments/stripe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "order-uuid-here",
    "amount": 1500,
    "currency": "USD"
  }'
```

## 🗄️ Database Schema

### Auth Service
- **Users**: id, name, email, password (hashed), role, phoneNumber, isActive

### Product Service
- **Products**: id, name, description, price, stock, category, imageUrl, sku, isActive

### Cart Service
- **Carts**: id, userId, totalAmount, itemCount, expiresAt
- **CartItems**: id, cartId, productId, productName, price, quantity, subtotal, imageUrl

### Order Service
- **Orders**: id, userId, orderNumber, status, totalAmount, shippingAddress, paymentMethod
- **OrderItems**: id, orderId, productId, productName, quantity, price, subtotal

### Payment Service
- **Payments**: id, orderId, userId, provider, amount, currency, status, transactionId, phoneNumber

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Helmet.js security headers
- Rate limiting on API Gateway
- CORS configuration
- Input validation
- Service-to-service authentication
- Webhook signature verification (Stripe, M-Pesa)

## 🛠️ Development

### Run Individual Service Locally

```bash
cd auth-service
npm install
npm run dev
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
```

### Stop Services

```bash
docker-compose down

# Remove volumes (caution: deletes data)
docker-compose down -v
```

## 🚢 Production Deployment

### Recommendations

1. **Use Managed Databases**: AWS RDS, DigitalOcean Managed PostgreSQL
2. **Use Environment Secrets Management**: AWS Secrets Manager, HashiCorp Vault
3. **Set Strong JWT Secret**: Minimum 32 characters, cryptographically random
4. **Enable HTTPS**: Use Let's Encrypt, AWS Certificate Manager
5. **Use Production M-Pesa Credentials**: Change `MPESA_ENVIRONMENT=production`
6. **Set Up Monitoring**: Prometheus, Grafana, or CloudWatch
7. **Configure Logging**: ELK Stack, Datadog, or CloudWatch Logs
8. **Use CI/CD**: GitHub Actions, GitLab CI, Jenkins

### Docker Production Build

```bash
# Build for production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

## 📊 Service Communication Flow

```
Client Request
     ↓
API Gateway (5000)
     ↓
┌────────────┬───────────┬──────────┬──────────┬──────────┐
│            │           │          │          │          │
Auth (3001)  Product    Cart       Order      Payment
             (3002)     (3005)     (3003)     (3004)
     ↓            ↓          ↓          ↓          ↓
Auth DB      Product DB  Cart DB    Order DB   Payment DB
```

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check Docker logs
docker-compose logs

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Check if databases are running
docker ps

# Rebuild with fresh databases
docker-compose down -v
docker-compose up --build
```

### M-Pesa Callback Not Working

- Ensure `MPESA_CALLBACK_URL` is publicly accessible
- Use ngrok for local testing: `ngrok http 5000`
- Check M-Pesa dashboard for error messages

### Stripe Webhook Issues

- Configure webhook endpoint in Stripe Dashboard
- Set `STRIPE_WEBHOOK_SECRET` from Stripe Dashboard
- Test with Stripe CLI: `stripe listen --forward-to localhost:5000/api/payments/webhook/stripe`

## 📚 Additional Resources

- [Sequelize Documentation](https://sequelize.org/)
- [M-Pesa API Documentation](https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate)
- [Stripe Documentation](https://stripe.com/docs)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Authors

Brian Mokua <brianoyaro2000@gmail.com>

---

**Need Help?** Open an issue or contact support.
