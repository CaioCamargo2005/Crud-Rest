from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, produtos

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API de Produtos - IAL-221",
    description=(
        "API RESTful de gerencialmento de produtos, desenvolvida para a "
        "Atividade Prática 2 da disciplina Arquitetura de APIs (IAL-221)"
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.ial221.edu.br", "https://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(produtos.router)


@app.get("/", tags=["Status"], summary="Verifica se a API está no ar")
def raiz():
    return {"status": "online", "documentacao": "/docs"}
