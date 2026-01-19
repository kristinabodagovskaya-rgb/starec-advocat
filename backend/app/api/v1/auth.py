"""
API для аутентификации
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.models import get_db, User
from app.core.config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# TODO: Implement these functions
# from app.core.security import (
#     create_access_token,
#     verify_password,
#     get_password_hash,
#     get_current_user
# )

@router.post("/register")
async def register(
    email: str,
    password: str,
    full_name: str,
    db: Session = Depends(get_db)
):
    """Регистрация нового пользователя"""

    # Проверка существования пользователя
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )

    # TODO: Хеширование пароля
    # hashed_password = get_password_hash(password)
    hashed_password = "temp_hash"  # Временно

    # Создание пользователя
    new_user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Пользователь успешно зарегистрирован",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name
        }
    }


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Вход в систему"""

    # Поиск пользователя
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )

    # TODO: Проверка пароля
    # if not verify_password(form_data.password, user.hashed_password):
    #     raise HTTPException(...)

    # TODO: Создание токена
    # access_token = create_access_token(
    #     data={"sub": user.email},
    #     expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # )

    access_token = "temp_token"  # Временно

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }


@router.get("/me")
async def get_current_user_info(
    # current_user: User = Depends(get_current_user)
    db: Session = Depends(get_db)
):
    """Получить информацию о текущем пользователе"""

    # TODO: Implement authentication
    # return {
    #     "id": current_user.id,
    #     "email": current_user.email,
    #     "full_name": current_user.full_name,
    #     "is_active": current_user.is_active
    # }

    return {"message": "TODO: Implement authentication"}


@router.post("/refresh")
async def refresh_token():
    """Обновление токена"""

    # TODO: Implement token refresh
    return {"message": "TODO: Implement token refresh"}
