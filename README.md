# API RESTful de Produtos — IAL-221

Projeto 1 da Atividade Prática 2 (IAL-221 — Arquitetura de APIs): CRUD de
produtos, autenticação JWT, CORS e documentação OpenAPI automática. Inclui
também uma **interface web simples** (`app/static/`) para usar a API sem
precisar de curl ou do Swagger no dia a dia.

## Como executar

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload
```

Depois é só abrir **http://localhost:8000** no navegador — essa é a interface
principal para usar a API no dia a dia.

- **Painel web (recomendado):** http://localhost:8000
- Documentação interativa (Swagger UI): http://localhost:8000/docs
- Documentação alternativa (ReDoc): http://localhost:8000/redoc
- Especificação OpenAPI (JSON): http://localhost:8000/openapi.json

## Usando o painel web

1. Abra http://localhost:8000. A lista de produtos já aparece, mesmo sem login
   (a leitura é pública).
2. Para adicionar, editar ou remover produtos, entre com usuário `admin` e
   senha `admin123` no painel à esquerda.
3. Depois de logado, o mesmo painel vira um formulário de produto. Preencha e
   clique em **Salvar produto**.
4. Para editar, clique em **Editar** na linha do produto — o formulário é
   preenchido automaticamente.
5. Para excluir, clique em **Excluir** e depois em **Confirmar?** (proteção
   contra clique acidental).
6. O indicador no topo ("API conectada"/"API offline") avisa se o servidor
   (`uvicorn`) não estiver rodando.

## Autenticação (uso via curl/Swagger, se precisar)

- `POST /auth/login` com `username=admin` e `password=admin123`
  (form-urlencoded) retorna um token JWT.
- Envie esse token no cabeçalho `Authorization: Bearer <token>` para acessar
  as rotas de escrita (`POST`, `PUT`, `DELETE`).
- As rotas de leitura (`GET`) são públicas.

## Endpoints

| Método | Rota                    | Descrição                     | Autenticação |
|--------|-------------------------|--------------------------------|--------------|
| GET    | /api/produtos           | Lista todos os produtos        | Não          |
| GET    | /api/produtos/{id}      | Busca um produto pelo id       | Não          |
| POST   | /api/produtos           | Cria um novo produto           | Sim (ADMIN)  |
| PUT    | /api/produtos/{id}      | Atualiza um produto existente  | Sim (ADMIN)  |
| DELETE | /api/produtos/{id}      | Remove um produto              | Sim (ADMIN)  |
| POST   | /auth/login             | Autentica e retorna o token JWT| Não          |
| GET    | /status                 | Verifica se a API está no ar   | Não          |

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

7 testes automatizados cobrem: listagem pública, bloqueio sem token (401),
login inválido (401), produto inexistente (404), validação de dados (422),
o fluxo CRUD completo autenticado e a entrega da interface web.

## Estrutura do projeto

```
rest-api-produtos/
├── app/
│   ├── main.py           (ponto de entrada + serve o painel web)
│   ├── database.py       (configuração do SQLAlchemy)
│   ├── models.py         (entidade Produto)
│   ├── schemas.py        (DTOs Pydantic)
│   ├── security.py       (JWT, hashing de senha)
│   ├── routers/
│   │   ├── auth.py       (login)
│   │   └── produtos.py   (CRUD)
│   └── static/            (painel web: HTML/CSS/JS puros, sem build)
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── tests/                 (7 testes automatizados)
├── requirements.txt
└── README.md
```
