from django.urls import path
from . import views as v
urlpatterns = [
    path("menu/", v.menu), path("me/", v.me), path("register/", v.register),
    path("login/", v.login_view), path("logout/", v.logout_view),
    path("orders/", v.create_order), path("my-orders/", v.my_orders),
    path("seller/orders/", v.seller_orders), path("seller/orders/<int:pk>/status/", v.set_status),
]
