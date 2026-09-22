# API RESTful de Produtos — IAL-221

Projeto 1 da Atividade Prática 2 (IAL-221 — Arquitetura de APIs). Reproduz em
Python/FastAPI o exemplo do Capítulo 12 da apostila (originalmente em Java/Spring Boot):
CRUD de produtos, autenticação JWT, CORS e documentação OpenAPI automática.

## Como executar

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload
```

A API sobe em `http://localhost:8000`.

- Documentação interativa (Swagger UI): **http://localhost:8000/docs**
- Documentação alternativa (ReDoc): http://localhost:8000/redoc
- Especificação OpenAPI (JSON): http://localhost:8000/openapi.json

## Autenticação

- `POST /auth/login` com `username=admin` e `password=admin123` (form-urlencoded)
  retorna um token JWT.
- Envie esse token no cabeçalho `Authorization: Bearer <token>` para acessar
  as rotas de escrita (`POST`, `PUT`, `DELETE`).
- As rotas de leitura (`GET`) são públicas.

No Swagger UI (`/docs`), clique no botão **Authorize** e cole
`Bearer <token>` para testar as rotas protegidas pela própria interface —
ótimo print para a seção de segurança do relatório.

## Endpoints

| Método | Rota                    | Descrição                     | Autenticação |
|--------|-------------------------|--------------------------------|--------------|
| GET    | /api/produtos           | Lista todos os produtos        | Não          |
| GET    | /api/produtos/{id}      | Busca um produto pelo id       | Não          |
| POST   | /api/produtos           | Cria um novo produto           | Sim (ADMIN)  |
| PUT    | /api/produtos/{id}      | Atualiza um produto existente  | Sim (ADMIN)  |
| DELETE | /api/produtos/{id}      | Remove um produto              | Sim (ADMIN)  |
| POST   | /auth/login             | Autentica e retorna o token JWT| Não          |

## Testando com cURL

```bash
# Login
curl -X POST http://localhost:8000/auth/login -d "username=admin&password=admin123"

# Criar produto (troque <TOKEN> pelo access_token retornado no login)
curl -X POST http://localhost:8000/api/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"nome":"Notebook","descricao":"16GB RAM","preco":3500.00,"estoque":10}'

# Listar
curl http://localhost:8000/api/produtos
```

## Rodando os testes

```bash
pytest tests/ -v
```

6 testes automatizados cobrem: listagem pública, bloqueio sem token (401),
login inválido (401), produto inexistente (404), validação de dados (422) e
o fluxo CRUD completo autenticado.
