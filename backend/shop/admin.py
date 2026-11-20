from django.contrib import admin
from .models import Category, Product, Order, OrderItem
admin.site.register([Category, Product])
class ItemInline(admin.TabularInline):
    model = OrderItem; extra = 0
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "phone", "total", "payment_method", "status", "created_at")
    inlines = [ItemInline]
