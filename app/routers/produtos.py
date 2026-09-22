"""CRUD de produtos — GET é público, POST/PUT/DELETE exigem token JWT com papel ADMIN."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.security import exigir_admin

router = APIRouter(prefix="/api/produtos", tags=["Produtos"])


@router.get("", response_model=List[schemas.ProdutoOut], summary="Lista todos os produtos")
def listar(db: Session = Depends(get_db)):
    return db.query(models.Produto).all()


@router.get(
    "/{produto_id}", response_model=schemas.ProdutoOut, summary="Busca um produto pelo id"
)
def buscar(produto_id: int, db: Session = Depends(get_db)):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto não encontrado com id: {produto_id}",
        )
    return produto


@router.post(
    "",
    response_model=schemas.ProdutoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Cria um novo produto (requer token JWT com papel ADMIN)",
)
def criar(
    produto: schemas.ProdutoCreate,
    db: Session = Depends(get_db),
    usuario: dict = Depends(exigir_admin),
):
    novo = models.Produto(**produto.model_dump())
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@router.put(
    "/{produto_id}",
    response_model=schemas.ProdutoOut,
    summary="Atualiza um produto existente (requer token JWT com papel ADMIN)",
)
def atualizar(
    produto_id: int,
    dados: schemas.ProdutoCreate,
    db: Session = Depends(get_db),
    usuario: dict = Depends(exigir_admin),
):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto não encontrado com id: {produto_id}",
        )
    for campo, valor in dados.model_dump().items():
        setattr(produto, campo, valor)
    db.commit()
    db.refresh(produto)
    return produto


@router.delete(
    "/{produto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove um produto (requer token JWT com papel ADMIN)",
)
def remover(
    produto_id: int, db: Session = Depends(get_db), usuario: dict = Depends(exigir_admin)
):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto não encontrado com id: {produto_id}",
        )
    db.delete(produto)
    db.commit()
    return None
