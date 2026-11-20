from django.contrib.auth.models import User
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=60)
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ["order"]
    def __str__(self): return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, related_name="products", on_delete=models.CASCADE)
    name = models.CharField(max_length=80)
    slug = models.SlugField(unique=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    emoji = models.CharField(max_length=4, default="🍽️")
    available = models.BooleanField(default=True)
    def __str__(self): return self.name

class Order(models.Model):
    PAYMENTS = [("cod", "Cash on Delivery"), ("gpay", "Google Pay"), ("phonepe", "PhonePe"),
                ("credit", "Credit Card"), ("debit", "Debit Card")]
    STATUSES = ["Placed", "Preparing", "Out for delivery", "Delivered", "Cancelled"]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    name = models.CharField(max_length=80)
    phone = models.CharField(max_length=15)
    address = models.TextField()
    payment_method = models.CharField(max_length=10, choices=PAYMENTS)
    payment_status = models.CharField(max_length=30, default="Pending")
    status = models.CharField(max_length=20, default="Placed")
    total = models.DecimalField(max_digits=9, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ["-created_at"]

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    qty = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
