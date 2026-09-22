from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = "chave-secreta-ial221-atividade-pratica-2-nao-usar-em-producao"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Usuário: admin / Senha: admin123
USUARIOS_FAKE_DB = {
    "admin": {
        "username": "admin",
        "hashed_password": pwd_context.hash("admin123"),
        "role": "ADMIN",
    }
}


def autenticar_usuario(username: str, password: str) -> Optional[dict]:
    usuario = USUARIOS_FAKE_DB.get(username)
    if not usuario:
        return None
    if not pwd_context.verify(password, usuario["hashed_password"]):
        return None
    return usuario


def criar_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def obter_usuario_atual(token: str = Depends(oauth2_scheme)) -> dict:
    credenciais_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        role: Optional[str] = payload.get("role")
        if username is None:
            raise credenciais_invalidas
    except JWTError as exc:
        raise credenciais_invalidas from exc
    return {"username": username, "role": role}


def exigir_admin(usuario: dict = Depends(obter_usuario_atual)) -> dict:
    if usuario.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas usuários com papel ADMIN podem realizar esta operação",
        )
    return usuario
