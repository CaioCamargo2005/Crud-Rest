"""Schemas Pydantic (DTOs)."""
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProdutoBase(BaseModel):
    nome: str = Field(..., min_length=1, description="Nome do produto")
    descricao: Optional[str] = Field(default=None, description="Descrição do produto")
    preco: float = Field(..., gt=0, description="Preço deve ser maior que zero")
    estoque: int = Field(..., ge=0, description="Quantidade em estoque")


class ProdutoCreate(ProdutoBase):
    """Payload aceito na criação e atualização de um produto."""


class ProdutoOut(ProdutoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
