from django.core.management.base import BaseCommand
from django.utils.text import slugify
from shop.menu_data import MENU
from shop.models import Category, Product

class Command(BaseCommand):
    help = "Load the Snack Bar menu"
    def handle(self, *a, **k):
        for i, (cat, items) in enumerate(MENU.items()):
            c, _ = Category.objects.update_or_create(name=cat, defaults={"order": i})
            for name, price, emoji in items:
                Product.objects.update_or_create(slug=slugify(name),
                    defaults={"category": c, "name": name, "price": price, "emoji": emoji})
        self.stdout.write(self.style.SUCCESS("Menu loaded"))
