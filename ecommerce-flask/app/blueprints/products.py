from flask import Blueprint, render_template, request
from app.models import Product, Category

products_bp = Blueprint('products', __name__)

@products_bp.route('/')
def list_products():
    page = request.args.get('page', 1, type=int)
    category_slug = request.args.get('category')
    search = request.args.get('search')
    sort = request.args.get('sort', 'newest')
    
    query = Product.query.filter_by(is_active=True)
    
    if category_slug:
        category = Category.query.filter_by(slug=category_slug).first()
        if category:
            query = query.filter_by(category_id=category.id)
    
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))
    
    if sort == 'price_low':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_high':
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.created_at.desc())
    
    products = query.paginate(page=page, per_page=12)
    categories = Category.query.all()
    
    return render_template('products/list.html', 
                         products=products, 
                         categories=categories,
                         current_category=category_slug,
                         search=search,
                         sort=sort)

@products_bp.route('/<slug>')
def product_detail(slug):
    product = Product.query.filter_by(slug=slug, is_active=True).first_or_404()
    related_products = Product.query.filter(
        Product.category_id == product.category_id,
        Product.id != product.id,
        Product.is_active == True
    ).limit(4).all()
    return render_template('products/detail.html', product=product, related_products=related_products)
