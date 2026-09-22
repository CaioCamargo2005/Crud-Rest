"""Endpoint de autenticação — emite o token JWT usado nas rotas protegidas."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas import Token
from app.security import autenticar_usuario, criar_access_token

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post(
    "/login",
    response_model=Token,
    summary="Autentica um usuário e retorna um token JWT",
    description="Usuário de teste: **admin** / Senha: **admin123**",
)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Token:
    usuario = autenticar_usuario(form_data.username, form_data.password)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
        )
    token = criar_access_token(data={"sub": usuario["username"], "role": usuario["role"]})
    return Token(access_token=token)
