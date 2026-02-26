"""
Seed script to populate the database with sample data.
Run this after setting up your database: python seed.py
"""

from app import create_app, db
from app.models import User, Category, Product

def seed_database():
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        OrderItem = db.Table('order_item', db.metadata, autoload_with=db.engine) if 'order_item' in db.metadata.tables else None
        db.drop_all()
        db.create_all()
        
        print("Creating categories...")
        categories = [
            Category(name="Electronics", slug="electronics"),
            Category(name="Clothing", slug="clothing"),
            Category(name="Home & Garden", slug="home-garden"),
            Category(name="Sports", slug="sports"),
            Category(name="Books", slug="books"),
            Category(name="Beauty", slug="beauty"),
        ]
        
        for category in categories:
            db.session.add(category)
        db.session.commit()
        
        print("Creating products...")
        products = [
            # Electronics
            Product(
                name="Wireless Bluetooth Headphones",
                slug="wireless-bluetooth-headphones",
                description="Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound quality. Perfect for music lovers and professionals.",
                price=79.99,
                image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
                stock=50,
                category_id=1
            ),
            Product(
                name="Smart Watch Pro",
                slug="smart-watch-pro",
                description="Advanced smartwatch with heart rate monitoring, GPS tracking, sleep analysis, and 7-day battery life. Water-resistant up to 50m.",
                price=199.99,
                image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
                stock=30,
                category_id=1
            ),
            Product(
                name="Portable Bluetooth Speaker",
                slug="portable-bluetooth-speaker",
                description="Compact yet powerful speaker with 360-degree sound, waterproof design, and 12-hour playtime. Take your music anywhere.",
                price=49.99,
                image_url="https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80",
                stock=75,
                category_id=1
            ),
            Product(
                name="USB-C Fast Charger",
                slug="usb-c-fast-charger",
                description="65W USB-C fast charger compatible with laptops, phones, and tablets. Compact design perfect for travel.",
                price=29.99,
                image_url="https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80",
                stock=100,
                category_id=1
            ),
            
            # Clothing
            Product(
                name="Classic Cotton T-Shirt",
                slug="classic-cotton-tshirt",
                description="Premium 100% organic cotton t-shirt. Comfortable, breathable, and perfect for everyday wear. Available in multiple colors.",
                price=24.99,
                image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
                stock=200,
                category_id=2
            ),
            Product(
                name="Denim Jeans Slim Fit",
                slug="denim-jeans-slim-fit",
                description="Classic slim-fit denim jeans made from premium stretch fabric. Comfortable all-day wear with a modern look.",
                price=59.99,
                image_url="https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80",
                stock=80,
                category_id=2
            ),
            Product(
                name="Winter Hoodie",
                slug="winter-hoodie",
                description="Cozy fleece-lined hoodie perfect for cold weather. Features kangaroo pocket and adjustable drawstring hood.",
                price=44.99,
                image_url="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80",
                stock=60,
                category_id=2
            ),
            
            # Home & Garden
            Product(
                name="Indoor Plant Set",
                slug="indoor-plant-set",
                description="Set of 3 low-maintenance indoor plants perfect for home or office. Includes ceramic pots and care instructions.",
                price=39.99,
                image_url="https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&q=80",
                stock=40,
                category_id=3
            ),
            Product(
                name="Scented Candle Collection",
                slug="scented-candle-collection",
                description="Luxury soy wax candles with natural fragrances. Set of 4 different scents. Burns for 40+ hours each.",
                price=34.99,
                image_url="https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400&q=80",
                stock=90,
                category_id=3
            ),
            Product(
                name="Kitchen Knife Set",
                slug="kitchen-knife-set",
                description="Professional 5-piece stainless steel knife set with wooden block. Includes chef's knife, bread knife, and more.",
                price=89.99,
                image_url="https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&q=80",
                stock=25,
                category_id=3
            ),
            
            # Sports
            Product(
                name="Yoga Mat Premium",
                slug="yoga-mat-premium",
                description="Extra thick 6mm yoga mat with non-slip surface. Eco-friendly material with carrying strap included.",
                price=34.99,
                image_url="https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&q=80",
                stock=70,
                category_id=4
            ),
            Product(
                name="Resistance Bands Set",
                slug="resistance-bands-set",
                description="Set of 5 resistance bands with different strengths. Perfect for home workouts, physical therapy, and stretching.",
                price=19.99,
                image_url="https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&q=80",
                stock=120,
                category_id=4
            ),
            Product(
                name="Running Shoes",
                slug="running-shoes",
                description="Lightweight running shoes with responsive cushioning and breathable mesh upper. Perfect for daily runs.",
                price=89.99,
                image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
                stock=45,
                category_id=4
            ),
            
            # Books
            Product(
                name="The Art of Programming",
                slug="art-of-programming",
                description="Essential guide for developers of all levels. Learn best practices, design patterns, and clean code principles.",
                price=29.99,
                image_url="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
                stock=100,
                category_id=5
            ),
            Product(
                name="Business Strategy Guide",
                slug="business-strategy-guide",
                description="Comprehensive guide to modern business strategies. Perfect for entrepreneurs and business leaders.",
                price=24.99,
                image_url="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&q=80",
                stock=80,
                category_id=5
            ),
            
            # Beauty
            Product(
                name="Skincare Essentials Kit",
                slug="skincare-essentials-kit",
                description="Complete skincare routine with cleanser, toner, serum, and moisturizer. Suitable for all skin types.",
                price=49.99,
                image_url="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80",
                stock=55,
                category_id=6
            ),
            Product(
                name="Natural Lip Balm Set",
                slug="natural-lip-balm-set",
                description="Set of 4 organic lip balms with natural ingredients. Includes vanilla, mint, berry, and honey flavors.",
                price=14.99,
                image_url="https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&q=80",
                stock=150,
                category_id=6
            ),
            Product(
                name="Hair Care Bundle",
                slug="hair-care-bundle",
                description="Professional hair care set with shampoo, conditioner, and hair mask. Paraben-free and suitable for all hair types.",
                price=39.99,
                image_url="https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&q=80",
                stock=65,
                category_id=6
            ),
        ]
        
        for product in products:
            db.session.add(product)
        db.session.commit()
        
        print("Creating demo user...")
        demo_user = User(
            username="demo",
            email="demo@example.com",
            phone="+254700000000"
        )
        demo_user.set_password("demo123")
        db.session.add(demo_user)
        db.session.commit()
        
        print("\n✅ Database seeded successfully!")
        print(f"   - Created {len(categories)} categories")
        print(f"   - Created {len(products)} products")
        print(f"   - Created 1 demo user (email: demo@example.com, password: demo123)")
        print("\nYou can now run the app with: python run.py")

if __name__ == "__main__":
    seed_database()
