import json
from decimal import Decimal
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt  # dev simplification: use CSRF tokens in production
from .models import Category, Product, Order, OrderItem

def body(r):
    try: return json.loads(r.body or "{}")
    except ValueError: return {}

def err(msg, code=400): return JsonResponse({"error": msg}, status=code)

def uj(u):
    if not u.is_authenticated: return None
    return {"id": u.id, "name": u.first_name or u.username, "email": u.email, "is_seller": u.is_staff}

def order_json(o, seller=False):
    d = {"id": o.id, "status": o.status, "total": float(o.total), "payment_method": o.get_payment_method_display(),
         "payment_status": o.payment_status, "created_at": o.created_at.strftime("%d %b %Y, %I:%M %p"),
         "items": [{"name": i.product.name, "qty": i.qty, "price": float(i.price)} for i in o.items.all()]}
    if seller:
        d.update(customer=o.name, phone=o.phone, address=o.address, email=o.user.email)
    return d

@csrf_exempt
def menu(r):
    out = []
    for c in Category.objects.prefetch_related("products"):
        out.append({"name": c.name, "items": [
            {"id": p.id, "name": p.name, "price": float(p.price), "emoji": p.emoji, "image": f"/images/{p.slug}.jpg"}
            for p in c.products.filter(available=True)]})
    return JsonResponse({"categories": out})

def me(r): return JsonResponse({"user": uj(r.user)})

@csrf_exempt
def register(r):
    d = body(r); email = (d.get("email") or "").strip().lower(); pw = d.get("password") or ""
    if not d.get("name") or "@" not in email or len(pw) < 6:
        return err("Enter your name, a valid email and a password of 6+ characters.")
    if User.objects.filter(username=email).exists(): return err("This email already has an account. Please log in.")
    u = User.objects.create_user(email, email, pw, first_name=d["name"].strip())
    login(r, u); return JsonResponse({"user": uj(u)})

@csrf_exempt
def login_view(r):
    d = body(r)
    u = authenticate(r, username=(d.get("email") or "").strip().lower(), password=d.get("password") or "")
    if not u: return err("Email or password is incorrect.", 401)
    login(r, u); return JsonResponse({"user": uj(u)})

@csrf_exempt
def logout_view(r): logout(r); return JsonResponse({"ok": True})

@csrf_exempt
def create_order(r):
    if not r.user.is_authenticated: return err("Please log in to place an order.", 401)
    d = body(r); items = d.get("items") or []
    if not items: return err("Your cart is empty.")
    if d.get("payment_method") not in dict(Order.PAYMENTS): return err("Choose a payment method.")
    if not (d.get("name") and d.get("phone") and d.get("address")): return err("Fill in name, phone and delivery address.")
    products = {p.id: p for p in Product.objects.filter(id__in=[i["id"] for i in items])}
    total = Decimal(0); lines = []
    for i in items:
        p = products.get(i["id"]); q = max(1, int(i.get("qty", 1)))
        if not p: return err("An item in your cart is no longer available.")
        total += p.price * q; lines.append((p, q))
    cod = d["payment_method"] == "cod"
    o = Order.objects.create(user=r.user, name=d["name"], phone=d["phone"], address=d["address"],
        payment_method=d["payment_method"], total=total,
        payment_status="Pay on delivery" if cod else "Paid (demo)")
    for p, q in lines: OrderItem.objects.create(order=o, product=p, qty=q, price=p.price)
    return JsonResponse({"order": order_json(o)})

def my_orders(r):
    if not r.user.is_authenticated: return err("Please log in.", 401)
    return JsonResponse({"orders": [order_json(o) for o in r.user.orders.prefetch_related("items__product")]})

def seller_orders(r):
    if not r.user.is_staff: return err("Seller access only.", 403)
    qs = Order.objects.select_related("user").prefetch_related("items__product")
    return JsonResponse({"orders": [order_json(o, True) for o in qs], "statuses": Order.STATUSES})

@csrf_exempt
def set_status(r, pk):
    if not r.user.is_staff: return err("Seller access only.", 403)
    s = body(r).get("status")
    if s not in Order.STATUSES: return err("Unknown status.")
    Order.objects.filter(pk=pk).update(status=s); return JsonResponse({"ok": True})
