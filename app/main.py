from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.routers import auth, produtos

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="API de Produtos - IAL-221",
    description=(
        "API RESTful de gerenciamento de produtos, desenvolvida para a "
        "Atividade Prática 2 da disciplina Arquitetura de APIs (IAL-221)."
    ),
    version="1.0.0",
)

# Configuração de CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(produtos.router)


@app.get("/status", tags=["Status"], summary="Verifica se a API está no ar")
def status():
    return {"status": "online", "documentacao": "/docs"}


# Interface web (index.html + assets) — deve ser montada por último, pois
# StaticFiles(html=True) atende a rota raiz "/" e qualquer caminho não
# reconhecido pelas rotas acima.
static_dir = Path(__file__).parent / "static"
app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")
