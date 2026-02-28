# 🚀 Quick Start Guide

## Get Started in 5 Minutes

### Step 1: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials (at minimum, set JWT_SECRET).

### Step 2: Start All Services

```bash
docker-compose up --build
```

Wait for all services to start (about 2-3 minutes first time).

### Step 3: Test the API

```bash
# Check if services are running
curl http://localhost:5000/health

# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phoneNumber": "254712345678"
  }'
```

### Step 4: Create Sample Data

Use the provided Postman collection or test scripts (coming soon).

## Service Ports

- **API Gateway**: http://localhost:5000 (Main entry point)
- **Auth Service**: http://localhost:3001
- **Product Service**: http://localhost:3002
- **Cart Service**: http://localhost:3005
- **Order Service**: http://localhost:3003
- **Payment Service**: http://localhost:3004

## Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart a service
docker-compose restart auth-service

# Rebuild a service
docker-compose up -d --build auth-service
```

## Next Steps

1. Configure M-Pesa credentials (for production)
2. Configure Stripe credentials
3. Set up ngrok for local M-Pesa testing
4. Import Postman collection for testing
5. Deploy to cloud provider

## Testing Payments Locally

### M-Pesa
1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 5000`
3. Copy the HTTPS URL and set as `MPESA_CALLBACK_URL` in `.env`
4. Restart payment-service: `docker-compose restart payment-service`

### Stripe
1. Install Stripe CLI
2. Run: `stripe listen --forward-to localhost:5000/api/payments/webhook/stripe`
3. Use test card: 4242 4242 4242 4242

## Troubleshooting

**Services won't start?**
- Ensure ports 5000, 3001-3004 are available
- Try: `docker-compose down -v && docker-compose up --build`

**Can't connect to database?**
- Wait 30 seconds for databases to initialize
- Check logs: `docker-compose logs auth-db`

**M-Pesa not working?**
- Ensure callback URL is publicly accessible (use ngrok)
- Check M-Pesa credentials are correct
- Verify phone number format: 254XXXXXXXXX

**Stripe webhooks failing?**
- Set correct `STRIPE_WEBHOOK_SECRET`
- Test with Stripe CLI first

---

**Happy Coding! 🎉**
