from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import Product, Order, OrderItem

cart_bp = Blueprint('cart', __name__)

def get_cart():
    """Get cart from session"""
    return session.get('cart', {})

def save_cart(cart):
    """Save cart to session"""
    session['cart'] = cart
    session.modified = True

@cart_bp.route('/')
def view_cart():
    cart = get_cart()
    cart_items = []
    total = 0
    
    for product_id, quantity in cart.items():
        product = Product.query.get(int(product_id))
        if product:
            subtotal = product.price * quantity
            cart_items.append({
                'product': product,
                'quantity': quantity,
                'subtotal': subtotal
            })
            total += subtotal
    
    return render_template('cart/view.html', cart_items=cart_items, total=total)

@cart_bp.route('/add/<int:product_id>', methods=['POST'])
def add_to_cart(product_id):
    product = Product.query.get_or_404(product_id)
    quantity = request.form.get('quantity', 1, type=int)
    
    if product.stock < quantity:
        flash('Not enough stock available', 'error')
        return redirect(url_for('products.product_detail', slug=product.slug))
    
    cart = get_cart()
    product_key = str(product_id)
    
    if product_key in cart:
        cart[product_key] += quantity
    else:
        cart[product_key] = quantity
    
    save_cart(cart)
    flash(f'{product.name} added to cart!', 'success')
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': True, 'cart_count': sum(cart.values())})
    
    return redirect(url_for('cart.view_cart'))

@cart_bp.route('/update/<int:product_id>', methods=['POST'])
def update_cart(product_id):
    quantity = request.form.get('quantity', 1, type=int)
    cart = get_cart()
    product_key = str(product_id)
    
    if quantity <= 0:
        cart.pop(product_key, None)
    else:
        product = Product.query.get_or_404(product_id)
        if product.stock >= quantity:
            cart[product_key] = quantity
        else:
            flash('Not enough stock', 'error')
    
    save_cart(cart)
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': True})
    
    return redirect(url_for('cart.view_cart'))

@cart_bp.route('/remove/<int:product_id>', methods=['POST'])
def remove_from_cart(product_id):
    cart = get_cart()
    cart.pop(str(product_id), None)
    save_cart(cart)
    flash('Item removed from cart', 'success')
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': True})
    
    return redirect(url_for('cart.view_cart'))

@cart_bp.route('/clear', methods=['POST'])
def clear_cart():
    save_cart({})
    flash('Cart cleared', 'success')
    return redirect(url_for('cart.view_cart'))

@cart_bp.route('/checkout')
@login_required
def checkout():
    cart = get_cart()
    if not cart:
        flash('Your cart is empty', 'error')
        return redirect(url_for('cart.view_cart'))
    
    cart_items = []
    total = 0
    
    for product_id, quantity in cart.items():
        product = Product.query.get(int(product_id))
        if product:
            subtotal = product.price * quantity
            cart_items.append({
                'product': product,
                'quantity': quantity,
                'subtotal': subtotal
            })
            total += subtotal
    
    return render_template('cart/checkout.html', cart_items=cart_items, total=total)

@cart_bp.route('/count')
def cart_count():
    cart = get_cart()
    return jsonify({'count': sum(cart.values())})
