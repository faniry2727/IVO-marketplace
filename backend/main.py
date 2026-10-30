import uuid
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db, Profile, Category, Shop, Product, Order, Delivery
from security import hash_password, verify_password, create_token, get_current_user_payload

app = FastAPI(title="IVO API Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTHENTIFICATION ---
class RegisterData(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "client"
    phone: str = ""
    city: str = ""

class LoginData(BaseModel):
    email: EmailStr
    password: str

@app.post("/api/auth/register")
def register(data: RegisterData, db: Session = Depends(get_db)):
    if db.query(Profile).filter(Profile.email == data.email).first():
        raise HTTPException(status_code=400, detail="E-mail déjà utilisé")
    role = data.role if data.role in ["client", "seller", "driver"] else "client"
    user = Profile(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=role,
        phone=data.phone,
        city=data.city
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "user": user}

@app.post("/api/auth/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(Profile).filter(Profile.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Identifiants incorrects")
    token = create_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "user": user}

@app.get("/api/auth/me")
def get_me(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user = db.query(Profile).filter(Profile.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user

# --- CATALOGUE PUBLIC (Pour la page d'accueil IVO) ---
@app.get("/api/public/categories")
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@app.get("/api/public/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.is_active == True).all()

@app.get("/api/public/shops")
def get_shops(db: Session = Depends(get_db)):
    return db.query(Shop).filter(Shop.is_active == True).all()

# --- COMMANDES & LIVRAISONS ---
class CreateOrderData(BaseModel):
    seller_id: str
    total_amount: int
    delivery_phone: str
    delivery_address: str
    reception_mode: str = "delivery"

@app.post("/api/orders")
def create_order(data: CreateOrderData, payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    new_order = Order(
        order_number=f"IVO-{uuid.uuid4().hex[:6].upper()}",
        client_id=payload["sub"],
        seller_id=data.seller_id,
        total_amount=data.total_amount,
        delivery_phone=data.delivery_phone,
        delivery_address=data.delivery_address,
        reception_mode=data.reception_mode
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    if data.reception_mode == "delivery":
        delivery = Delivery(
            order_id=new_order.id,
            delivery_address=new_order.delivery_address,
            delivery_phone=new_order.delivery_phone
        )
        db.add(delivery)
        db.commit()
    return new_order

@app.get("/api/deliveries/available")
def get_available_deliveries(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    return db.query(Delivery).filter(Delivery.status == "WAITING_FOR_DRIVER").all()

# --- ADMINISTRATION (Pour vous et votre ami) ---
@app.get("/api/admin/users")
def get_all_users(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Réservé aux administrateurs")
    return db.query(Profile).all()
