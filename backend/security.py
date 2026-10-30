from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = "IVO_SECRET_KEY_MASTER_2_ENI_2026"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_bearer = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(data: dict) -> str:
    payload = data.copy()
    payload.update({"exp": datetime.utcnow() + timedelta(days=7)})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_payload(credentials: HTTPAuthorizationCredentials = Security(security_bearer)) -> dict:
    try:
        token = credentials.credentials
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Session expirée ou invalide")
