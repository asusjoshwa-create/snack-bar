# Snack Bar (Sivakasi) – React + Tailwind + Django

## 1. Backend (Python / Django)
    cd backend
    python -m venv venv && source venv/bin/activate     # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    python manage.py makemigrations shop
    python manage.py migrate
    python manage.py seed_menu            # loads all 4 menu sections
    python manage.py createsuperuser      # this account is the SELLER (log in on the site with its email/username)
    python manage.py runserver            # http://127.0.0.1:8000

The seller account must use an email as its username so it can log in from the site's login form.
Sellers also get a DASHBOARD link in the navbar and the Django admin at /admin/.

## 2. Frontend (React + Tailwind via Vite)
    cd frontend
    npm install
    npm run dev                           # http://localhost:5173

## 3. Photos
Put one photo per item in `frontend/public/images/` named after the item, lowercase with hyphens:
`cheese-pizza.jpg`, `veg-burger.jpg`, `french-fries.jpg`, `kit-kat-cake.jpg` ...
The hero background is `hero.jpg`. Items without a photo show an emoji until you add one.

## Notes
- Online payments (GPay, PhonePe, cards) are a demo; card data is not sent or stored. Use Razorpay/PhonePe gateway for real money.
- Before going live: set a real SECRET_KEY, DEBUG=False, and enable CSRF protection (views use csrf_exempt for easy local dev).
