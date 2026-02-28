# 🏗️ Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT/FRONTEND                          │
│                      (React - Coming Soon)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY (Port 5000)                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Rate Limiting                                             │ │
│  │ • CORS                                                      │ │
│  │ • Routing                                                   │ │
│  │ • Request Forwarding                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────┬──────────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │          │
       │          │          │          │          │
   ┌───▼───┐  ┌──▼───┐  ┌───▼───┐  ┌──▼───┐  ┌──▼───┐
   │ Auth  │  │Product│ │ Cart  │  │ Order │  │Payment│
   │Service│  │Service│ │Service│  │Service│  │Service│
   │:3001  │  │:3002  │ │:3005  │  │:3003  │  │:3004  │
   └───┬───┘  └──┬───┘  └───┬───┘  └───┬───┘  └──┬───┘
       │         │          │          │          │
       │         │          │          │          │
   ┌───▼───┐  ┌──▼───┐  ┌───▼───┐  ┌───▼───┐  ┌──▼───┐
   │Auth DB│  │Prod DB│ │Cart DB│  │Order DB│ │Pay DB│
   │:5432  │  │:5432  │ │:5432  │  │:5432   │ │:5432 │
   └───────┘  └──────┘  └────────┘  └────────┘  └──────┘
```

## Microservices Breakdown

### 1. API Gateway (Port 5000)
**Purpose**: Single entry point for all client requests

**Responsibilities**:
- Route requests to appropriate services
- Rate limiting
- CORS handling
- Load balancing (future)

**Technology Stack**:
- Express.js
- http-proxy-middleware
- express-rate-limit

---

### 2. Auth Service (Port 3001)
**Purpose**: User authentication and authorization

**Responsibilities**:
- User registration
- User login (JWT tokens)
- Token verification
- Profile management

**Database Schema**:
```
Users
├── id (UUID)
├── name
├── email (unique)
├── password (hashed with bcrypt)
├── role (customer/admin)
├── phoneNumber
├── isActive
└── timestamps
```

**Key Endpoints**:
- POST `/api/register` - Register user
- POST `/api/login` - Login user
- GET `/api/profile` - Get profile (protected)
- POST `/api/verify` - Verify token (internal)

---

### 3. Product Service (Port 3002)
**Purpose**: Product catalog management

**Responsibilities**:
- CRUD operations for products
- Stock management
- Product search & filtering
- Stock availability checks

**Database Schema**:
```
Products
├── id (UUID)
├── name
├── description
├── price
├── stock
├── category
├── imageUrl
├── images (array)
├── sku (unique)
├── isActive
└── timestamps
```

**Key Endpoints**:
- GET `/api/products` - List products (public)
- POST `/api/products` - Create product (admin)
- PUT `/api/products/:id` - Update product (admin)
- POST `/api/internal/check-stock` - Check stock (internal)

---

### 4. Cart Service (Port 3005)
**Purpose**: Shopping cart management

**Responsibilities**:
- Add/remove items from cart
- Update item quantities
- Persist cart across sessions
- Calculate cart totals
- Stock validation before adding items
- Cart retrieval for checkout

**Database Schema**:
```
Carts
├── id (UUID)
├── userId (unique)
├── totalAmount
├── itemCount
├── expiresAt
└── timestamps

CartItems
├── id (UUID)
├── cartId
├── productId
├── productName
├── price
├── quantity
├── subtotal
├── imageUrl
└── timestamps
```

**Key Endpoints**:
- GET `/api/cart` - Get user cart
- POST `/api/cart/items` - Add item to cart
- PUT `/api/cart/items/:id` - Update item quantity
- DELETE `/api/cart/items/:id` - Remove item
- DELETE `/api/cart` - Clear cart
- POST `/api/internal/cart/checkout` - Get cart for checkout (internal)

---

### 5. Order Service (Port 3003)
**Purpose**: Order processing and management

**Responsibilities**:
- Create orders
- Order lifecycle management
- Stock reservation
- Order cancellation

**Database Schema**:
```
Orders
├── id (UUID)
├── userId
├── orderNumber (unique)
├── status (pending/paid/shipped/etc)
├── totalAmount
├── shippingAddress (JSON)
├── paymentMethod
├── paymentStatus
└── timestamps

OrderItems
├── id (UUID)
├── orderId
├── productId
├── productName
├── quantity
├── price
└── subtotal
```

**Key Endpoints**:
- POST `/api/orders` - Create order
- GET `/api/orders` - Get user orders
- GET `/api/orders/:id` - Get order details
- POST `/api/internal/update-status` - Update status (internal)

---

### 6. Payment Service (Port 3004)
**Purpose**: Payment processing (M-Pesa + Stripe)

**Responsibilities**:
- M-Pesa STK Push integration
- Stripe payment intent creation
- Webhook handling (M-Pesa & Stripe)
- Payment status tracking
- Order status updates

**Database Schema**:
```
Payments
├── id (UUID)
├── orderId
├── userId
├── provider (mpesa/stripe/cash_on_delivery)
├── amount
├── currency
├── status (pending/completed/failed)
├── transactionId
├── externalReference
├── phoneNumber (for M-Pesa)
├── metadata (JSON)
└── timestamps
```

**Key Endpoints**:
- POST `/api/payments/mpesa` - Initiate M-Pesa payment
- POST `/api/payments/stripe` - Initiate Stripe payment
- POST `/api/webhook/mpesa` - M-Pesa callback
- POST `/api/webhook/stripe` - Stripe webhook

**Payment Flow**:

#### M-Pesa Flow:
```
1. User initiates payment → POST /api/payments/mpesa
2. Service sends STK Push to user's phone
3. User enters M-Pesa PIN
4. Safaricom sends callback → POST /api/webhook/mpesa
5. Service verifies and updates order status
```

#### Stripe Flow:
```
1. User initiates payment → POST /api/payments/stripe
2. Service creates payment intent
3. Frontend confirms payment with client secret
4. Stripe sends webhook → POST /api/webhook/stripe
5. Service verifies and updates order status
```

---

## Service Communication

### Authentication Flow
```
Client → API Gateway → Auth Service
                      ↓
                  Generate JWT
                      ↓
                  Return Token
```

### Shopping Cart Flow
```
Client → API Gateway → Cart Service
                          ↓
                    Verify User Auth → Auth Service
                          ↓
                    Get Product Details → Product Service
                          ↓
                    Check Stock Availability
                          ↓
                    Add/Update Cart Item
                          ↓
                    Calculate Totals
                          ↓
                    Return Updated Cart
```

### Order Creation Flow
```
Client → API Gateway → Order Service
                          ↓
                    Check Stock → Product Service
                          ↓
                    Create Order
                          ↓
                    Reserve Stock → Product Service
                          ↓
                    Return Order
```

### Payment Flow
```
Client → API Gateway → Payment Service
                          ↓
                    Create Payment Record
                          ↓
                    Initiate Payment (M-Pesa/Stripe)
                          ↓
                    Wait for Callback
                          ↓
                    Update Order Status → Order Service
```

---

## Database Architecture

Each microservice has its own PostgreSQL database:

```
┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
│  auth_db    │  │ product_db   │  │  cart_db    │  │  order_db   │  │  payment_db  │
│             │  │              │  │             │  │             │  │              │
│ • users     │  │ • products   │  │ • carts     │  │ • orders    │  │ • payments   │
│             │  │              │  │ • cartitems │  │ • orderitems│  │              │
└─────────────┘  └──────────────┘  └─────────────┘  └─────────────┘  └──────────────┘
     :5432            :5432             :5432             :5432             :5432
```

**Why Separate Databases?**
- Data isolation
- Independent scaling
- Service autonomy
- Fault isolation

---

## Technology Choices

### Why Node.js + Express?
- Fast, lightweight
- Great for I/O operations
- Huge ecosystem
- JavaScript everywhere (frontend + backend)

### Why Sequelize?
- Powerful ORM
- PostgreSQL support
- Migrations & seeds
- TypeScript support (future)

### Why PostgreSQL?
- ACID compliance
- JSON support (metadata)
- Production-ready
- Excellent performance

### Why Microservices?
- **Scalability**: Scale services independently
- **Resilience**: Failure isolation
- **Technology flexibility**: Use different tech per service
- **Team scalability**: Teams can work independently
- **Deployment**: Deploy services independently

---

## Security Measures

1. **JWT Authentication**: Stateless, secure tokens
2. **Password Hashing**: bcrypt with salt rounds
3. **Helmet.js**: HTTP security headers
4. **Rate Limiting**: Prevent abuse
5. **CORS**: Controlled origin access
6. **Input Validation**: Sequelize validation
7. **Webhook Verification**: Stripe & M-Pesa signatures
8. **Environment Variables**: Sensitive data protection

---

## Deployment Strategy

### Development
```bash
docker-compose up --build
```

### Staging
```bash
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up
```

### Production
- Use Kubernetes for orchestration
- Managed PostgreSQL (AWS RDS, DigitalOcean)
- Environment secrets (AWS Secrets Manager)
- Load balancer (AWS ALB, Nginx)
- Monitoring (Prometheus, Grafana)
- Logging (ELK Stack, CloudWatch)

---

## Scalability Considerations

### Horizontal Scaling
Each service can be scaled independently:

```
API Gateway (3 instances)
    ↓
Auth Service (2 instances)
Product Service (5 instances)  ← High traffic
Order Service (3 instances)
Payment Service (2 instances)
```

### Database Scaling
- Read replicas for heavy read operations
- Connection pooling
- Indexing on frequently queried fields
- Caching layer (Redis) - future

### Caching Strategy (Future)
```
Redis Cache
├── Product catalog
├── User sessions
└── Order summaries
```

---

## Monitoring & Observability

### Health Checks
Each service exposes `/health` endpoint

### Logging
- Structured logging (Winston/Pino)
- Centralized log aggregation
- Error tracking (Sentry)

### Metrics (Future)
- Request/response times
- Error rates
- Database query performance
- Payment success rates

---

## Future Enhancements

1. **API Gateway Enhancements**
   - GraphQL support
   - WebSocket support
   - Advanced rate limiting

2. **Notification Service**
   - Email notifications
   - SMS notifications
   - Push notifications

3. **Search Service**
   - Elasticsearch integration
   - Advanced product search
   - Recommendations

4. **Analytics Service**
   - Sales analytics
   - User behavior tracking
   - Inventory forecasting

5. **Admin Dashboard**
   - Order management
   - Product management
   - Analytics dashboard

---

**Built for Scale | Designed for Production | Ready for the Future**
