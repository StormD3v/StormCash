from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from models import BaseUser
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        logger.info("[AUTH] Token received, attempting to decode")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        
        if user_id is None:
            logger.error("[AUTH] JWT decoded but user_id is None - raising 401")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"[AUTH] JWT decode failed: {type(e).__name__}: {e} - raising 401")
        raise credentials_exception
    except Exception as e:
        logger.error(f"[AUTH] Unexpected exception during JWT decode: {type(e).__name__}: {e} - raising 401")
        raise credentials_exception
    
    user = db.execute(
        select(BaseUser).where(BaseUser.id == user_id)
    ).scalar_one_or_none()
    
    if user is None:
        logger.error(f"[AUTH] User not found in database for user_id: {user_id} - raising 401")
        raise credentials_exception
    
    logger.info(f"[AUTH] Authentication successful for user: {user.username}")
    return user
