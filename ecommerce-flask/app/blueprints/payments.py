from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, current_app
from flask_login import login_required, current_user
import stripe
import requests
from datetime import datetime
import base64
from app import db
from app.models import Product, Order, OrderItem
from app.blueprints.cart import get_cart, save_cart

payments_bp = Blueprint('payments', __name__)

def get_mpesa_access_token():
    """Get M-Pesa access token from Safaricom Daraja API"""
    consumer_key = current_app.config['MPESA_CONSUMER_KEY']
    consumer_secret = current_app.config['MPESA_CONSUMER_SECRET']
    
    api_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    if current_app.config['MPESA_ENVIRONMENT'] == 'production':
        api_url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    
    credentials = base64.b64encode(f"{consumer_key}:{consumer_secret}".encode()).decode()
    headers = {"Authorization": f"Basic {credentials}"}
    
    response = requests.get(api_url, headers=headers)
    return response.json().get('access_token')

def generate_mpesa_password():
    """Generate M-Pesa password for STK push"""
    shortcode = current_app.config['MPESA_SHORTCODE']
    passkey = current_app.config['MPESA_PASSKEY']
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    
    password_str = f"{shortcode}{passkey}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode()
    
    return password, timestamp

@payments_bp.route('/process', methods=['POST'])
@login_required
def process_payment():
    payment_method = request.form.get('payment_method')
    shipping_address = request.form.get('shipping_address')
    phone = request.form.get('phone')
    
    cart = get_cart()
    if not cart:
        flash('Your cart is empty', 'error')
        return redirect(url_for('cart.view_cart'))
    
    # Calculate total
    total = 0
    for product_id, quantity in cart.items():
        product = Product.query.get(int(product_id))
        if product:
            total += product.price * quantity
    
    # Create order
    order = Order(
        user_id=current_user.id,
        total=total,
        status='pending',
        payment_method=payment_method,
        shipping_address=shipping_address,
        phone=phone
    )
    db.session.add(order)
    db.session.flush()
    
    # Create order items
    for product_id, quantity in cart.items():
        product = Product.query.get(int(product_id))
        if product:
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                price=product.price
            )
            db.session.add(order_item)
            # Update stock
            product.stock -= quantity
    
    db.session.commit()
    
    # Store order ID in session for payment processing
    session['pending_order_id'] = order.id
    
    if payment_method == 'stripe':
        return redirect(url_for('payments.stripe_checkout', order_id=order.id))
    elif payment_method == 'mpesa':
        return redirect(url_for('payments.mpesa_checkout', order_id=order.id))
    else:
        flash('Invalid payment method', 'error')
        return redirect(url_for('cart.checkout'))

@payments_bp.route('/stripe/checkout/<int:order_id>')
@login_required
def stripe_checkout(order_id):
    order = Order.query.get_or_404(order_id)
    
    if order.user_id != current_user.id:
        flash('Unauthorized', 'error')
        return redirect(url_for('main.index'))
    
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
    
    line_items = []
    for item in order.items:
        line_items.append({
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': item.product.name,
                    'images': [item.product.image_url] if item.product.image_url else [],
                },
                'unit_amount': int(item.price * 100),  # Stripe uses cents
            },
            'quantity': item.quantity,
        })
    
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=url_for('payments.payment_success', order_id=order.id, _external=True) + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=url_for('payments.payment_cancel', order_id=order.id, _external=True),
            metadata={'order_id': order.id}
        )
        return redirect(checkout_session.url)
    except Exception as e:
        flash(f'Payment error: {str(e)}', 'error')
        return redirect(url_for('cart.checkout'))

@payments_bp.route('/mpesa/checkout/<int:order_id>')
@login_required
def mpesa_checkout(order_id):
    order = Order.query.get_or_404(order_id)
    
    if order.user_id != current_user.id:
        flash('Unauthorized', 'error')
        return redirect(url_for('main.index'))
    
    return render_template('payments/mpesa_checkout.html', order=order)

@payments_bp.route('/mpesa/stk-push', methods=['POST'])
@login_required
def mpesa_stk_push():
    """Initiate M-Pesa STK Push"""
    order_id = request.form.get('order_id')
    phone = request.form.get('phone')
    
    order = Order.query.get_or_404(order_id)
    
    if order.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    try:
        access_token = get_mpesa_access_token()
        password, timestamp = generate_mpesa_password()
        
        api_url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        if current_app.config['MPESA_ENVIRONMENT'] == 'production':
            api_url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        # Amount in KES (convert from USD if needed, here assuming direct KES)
        amount = int(order.total)
        
        # Format phone number (remove leading 0 or +, ensure starts with 254)
        phone = phone.strip().replace('+', '')
        if phone.startswith('0'):
            phone = '254' + phone[1:]
        elif not phone.startswith('254'):
            phone = '254' + phone
        
        payload = {
            "BusinessShortCode": current_app.config['MPESA_SHORTCODE'],
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone,
            "PartyB": current_app.config['MPESA_SHORTCODE'],
            "PhoneNumber": phone,
            "CallBackURL": current_app.config['MPESA_CALLBACK_URL'],
            "AccountReference": f"Order{order.id}",
            "TransactionDesc": f"Payment for Order #{order.id}"
        }
        
        response = requests.post(api_url, json=payload, headers=headers)
        result = response.json()
        
        if result.get('ResponseCode') == '0':
            # Store checkout request ID for verification
            order.payment_id = result.get('CheckoutRequestID')
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Please check your phone and enter M-Pesa PIN',
                'checkout_request_id': result.get('CheckoutRequestID')
            })
        else:
            return jsonify({
                'success': False,
                'message': result.get('CustomerMessage', 'Failed to initiate payment')
            })
            
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@payments_bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """Handle M-Pesa callback"""
    data = request.get_json()
    
    result_code = data['Body']['stkCallback']['ResultCode']
    checkout_request_id = data['Body']['stkCallback']['CheckoutRequestID']
    
    order = Order.query.filter_by(payment_id=checkout_request_id).first()
    
    if order:
        if result_code == 0:
            # Payment successful
            order.status = 'paid'
            
            # Extract transaction details
            callback_metadata = data['Body']['stkCallback'].get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])
            
            for item in items:
                if item.get('Name') == 'MpesaReceiptNumber':
                    order.payment_id = item.get('Value')
                    break
            
            # Clear cart
            cart_key = f'cart_{order.user_id}'
            session.pop(cart_key, None)
        else:
            order.status = 'failed'
        
        db.session.commit()
    
    return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'})

@payments_bp.route('/mpesa/check-status/<int:order_id>')
@login_required
def mpesa_check_status(order_id):
    """Check M-Pesa payment status"""
    order = Order.query.get_or_404(order_id)
    
    if order.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    return jsonify({
        'status': order.status,
        'paid': order.status == 'paid'
    })

@payments_bp.route('/success/<int:order_id>')
@login_required
def payment_success(order_id):
    order = Order.query.get_or_404(order_id)
    
    if order.user_id != current_user.id:
        flash('Unauthorized', 'error')
        return redirect(url_for('main.index'))
    
    # Verify Stripe payment if session_id is provided
    session_id = request.args.get('session_id')
    if session_id and order.payment_method == 'stripe':
        stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
        try:
            checkout_session = stripe.checkout.Session.retrieve(session_id)
            if checkout_session.payment_status == 'paid':
                order.status = 'paid'
                order.payment_id = checkout_session.payment_intent
                db.session.commit()
                # Clear cart
                save_cart({})
        except Exception as e:
            flash(f'Error verifying payment: {str(e)}', 'warning')
    
    return render_template('payments/success.html', order=order)

@payments_bp.route('/cancel/<int:order_id>')
@login_required
def payment_cancel(order_id):
    order = Order.query.get_or_404(order_id)
    
    if order.user_id != current_user.id:
        flash('Unauthorized', 'error')
        return redirect(url_for('main.index'))
    
    # Restore stock
    for item in order.items:
        item.product.stock += item.quantity
    
    order.status = 'cancelled'
    db.session.commit()
    
    flash('Payment was cancelled', 'warning')
    return redirect(url_for('cart.view_cart'))

@payments_bp.route('/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    payload = request.get_data()
    sig_header = request.headers.get('Stripe-Signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, current_app.config['STRIPE_WEBHOOK_SECRET']
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        order_id = session.metadata.get('order_id')
        
        if order_id:
            order = Order.query.get(order_id)
            if order:
                order.status = 'paid'
                order.payment_id = session.payment_intent
                db.session.commit()
    
    return jsonify({'status': 'success'})

@payments_bp.route('/orders')
@login_required
def order_history():
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    return render_template('payments/orders.html', orders=orders)

@payments_bp.route('/orders/<int:order_id>')
@login_required
def order_detail(order_id):
    order = Order.query.get_or_404(order_id)
    
    if order.user_id != current_user.id:
        flash('Unauthorized', 'error')
        return redirect(url_for('main.index'))
    
    return render_template('payments/order_detail.html', order=order)
