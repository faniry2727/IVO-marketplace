import psycopg2
from passlib.context import CryptContext
from database import SessionLocal, Category, Shop, Product, Profile

db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_pwd = pwd_context.hash("demo1234")

print("1. Insertion des comptes de test...")
accounts = [
    {"email": "admin@ketrika.mg", "hashed_password": hashed_pwd, "full_name": "Super Admin IVO", "role": "admin", "phone": "0340000001", "city": "Antananarivo"},
    {"email": "client@ketrika.mg", "hashed_password": hashed_pwd, "full_name": "Client Test", "role": "client", "phone": "0340000002", "city": "Antananarivo"},
    {"email": "hery.seller@ketrika.mg", "hashed_password": hashed_pwd, "full_name": "Hery Vendeur", "role": "seller", "phone": "0340000003", "city": "Fianarantsoa"},
    {"email": "faly.driver@ketrika.mg", "hashed_password": hashed_pwd, "full_name": "Faly Livreur", "role": "driver", "phone": "0340000004", "city": "Antsirabe"},
]

for acc in accounts:
    user = db.query(Profile).filter(Profile.email == acc["email"]).first()
    if not user:
        db.add(Profile(**acc))
    else:
        user.hashed_password = hashed_pwd # Réinitialise le mot de passe sur demo1234

# 2. Catégories officielles
categories_data = [
    {"name": "Mode", "slug": "mode", "icon_name": "Shirt"},
    {"name": "Electronique", "slug": "electronique", "icon_name": "Smartphone"},
    {"name": "Maison", "slug": "maison", "icon_name": "Home"},
    {"name": "Alimentation", "slug": "alimentation", "icon_name": "Utensils"},
    {"name": "Beaute", "slug": "beaute", "icon_name": "Sparkles"},
]
for cat in categories_data:
    if not db.query(Category).filter(Category.slug == cat["slug"]).first():
        db.add(Category(**cat))

# 3. Boutiques populaires
shops_data = [
    {"name": "Naina Electronics", "city": "Antsirabe", "description": "Electronique et accessoires à Antsirabe"},
    {"name": "Maison Mahajanga", "city": "Mahajanga", "description": "Tout pour la maison à Mahajanga"},
    {"name": "COMPUTER STORE", "city": "Fianarantsoa", "description": "Vente d'ordinateurs et imprimantes à Fianarantsoa"},
]
for s in shops_data:
    if not db.query(Shop).filter(Shop.name == s["name"]).first():
        db.add(Shop(**s))

db.commit()
db.close()
print("-> Tous les utilisateurs et données sont prêts dans PostgreSQL !")
