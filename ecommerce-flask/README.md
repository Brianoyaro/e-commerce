# ShopEase - E-Commerce Platform

A modern, mobile-friendly e-commerce website built with Flask and TailwindCSS, featuring Stripe and M-Pesa payment integrations.

![ShopEase](https://images.unsplash.com/photo-1557821552-17105176677c?w=800&q=80)

## Features

- 🛒 **Full Shopping Cart** - Add, update, and remove items
- 💳 **Stripe Payments** - Secure card payments via Stripe Checkout
- 📱 **M-Pesa Integration** - Mobile money payments for African markets (STK Push)
- 👤 **User Authentication** - Register, login, and profile management
- 📦 **Order Management** - Track order history and status
- 🎨 **Modern UI** - Beautiful, responsive design with TailwindCSS
- 📱 **Mobile Friendly** - Fully responsive on all devices
- 🔍 **Product Search & Filtering** - Find products easily
- 📂 **Category Navigation** - Browse products by category

## Tech Stack

- **Backend**: Flask (Python)
- **Database**: SQLAlchemy with SQLite (easily switch to PostgreSQL)
- **Frontend**: TailwindCSS (via CDN)
- **Payments**: Stripe, M-Pesa (Safaricom Daraja API)
- **Authentication**: Flask-Login

## Quick Start

### 1. Clone and Install

```bash
cd ~/ecommerce-flask

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your API keys
nano .env
```

Required API Keys:
- **Stripe**: Get from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
- **M-Pesa**: Get from [Safaricom Daraja Portal](https://developer.safaricom.co.ke/)

### 3. Initialize Database

```bash
# Seed the database with demo products
python seed.py
```

### 4. Run the Application

```bash
python run.py
```

Visit `http://localhost:5000` in your browser.

## Demo Account

After seeding, use these credentials:
- **Email**: demo@example.com
- **Password**: demo123

## Project Structure

```
ecommerce-flask/
├── app/
│   ├── __init__.py          # App factory
│   ├── models.py             # Database models
│   ├── blueprints/
│   │   ├── main.py           # Home, about, contact
│   │   ├── auth.py           # Authentication
│   │   ├── products.py       # Product listing/detail
│   │   ├── cart.py           # Shopping cart
│   │   └── payments.py       # Stripe & M-Pesa payments
│   ├── templates/
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── about.html
│   │   ├── contact.html
│   │   ├── auth/
│   │   ├── products/
│   │   ├── cart/
│   │   └── payments/
│   └── static/
├── config.py                 # Configuration
├── run.py                    # Entry point
├── seed.py                   # Database seeder
├── requirements.txt
├── .env.example
└── README.md
```

## Payment Integration Details

### Stripe

Stripe Checkout is used for card payments. The integration:
1. Creates a Stripe Checkout Session with line items
2. Redirects customer to Stripe's hosted checkout page
3. Handles success/cancel redirects
4. Verifies payment via webhooks (optional but recommended)

### M-Pesa (STK Push)

The M-Pesa integration uses Safaricom's Daraja API:
1. Customer enters their M-Pesa phone number
2. STK Push is initiated to the customer's phone
3. Customer enters their M-Pesa PIN
4. Payment confirmation is received via callback
5. Order status is updated

**Note**: For production, you'll need:
- A registered Paybill/Till number
- Approved Daraja API credentials
- HTTPS callback URL

## Customization

### Adding Products

Use the admin interface (to be added) or modify `seed.py`:

```python
product = Product(
    name="New Product",
    slug="new-product",
    description="Description here",
    price=29.99,
    image_url="https://example.com/image.jpg",
    stock=100,
    category_id=1
)
db.session.add(product)
db.session.commit()
```

### Styling

The project uses TailwindCSS via CDN. Customize colors in `base.html`:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#6366f1',
                secondary: '#8b5cf6',
                accent: '#ec4899',
            }
        }
    }
}
```

## Production Deployment

1. **Set `DEBUG=False`** in production
2. **Use PostgreSQL** instead of SQLite
3. **Configure proper secret keys**
4. **Set up HTTPS** (required for M-Pesa callbacks)
5. **Configure Stripe webhooks** for reliable payment confirmation

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For questions or issues, please open an issue on GitHub.
