"""Testes de integração da API de Produtos."""


def _obter_token(client):
    resposta = client.post("/auth/login", data={"username": "admin", "password": "admin123"})
    assert resposta.status_code == 200
    return resposta.json()["access_token"]


def test_listar_produtos_sem_autenticacao_deve_funcionar(client):
    resposta = client.get("/api/produtos")
    assert resposta.status_code == 200
    assert isinstance(resposta.json(), list)


def test_criar_produto_sem_token_deve_retornar_401(client):
    resposta = client.post(
        "/api/produtos",
        json={"nome": "Mouse", "descricao": "Sem fio", "preco": 89.9, "estoque": 50},
    )
    assert resposta.status_code == 401


def test_login_com_credenciais_invalidas_deve_retornar_401(client):
    resposta = client.post("/auth/login", data={"username": "admin", "password": "senhaerrada"})
    assert resposta.status_code == 401


def test_buscar_produto_inexistente_deve_retornar_404(client):
    resposta = client.get("/api/produtos/999999")
    assert resposta.status_code == 404
    assert "não encontrado" in resposta.json()["detail"]


def test_criar_produto_com_preco_invalido_deve_retornar_422(client):
    token = _obter_token(client)
    resposta = client.post(
        "/api/produtos",
        json={"nome": "Produto Invalido", "preco": -10, "estoque": 5},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resposta.status_code == 422


def test_fluxo_completo_crud_com_autenticacao(client):
    token = _obter_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    criado = client.post(
        "/api/produtos",
        json={"nome": "Notebook", "descricao": "16GB RAM", "preco": 3500.0, "estoque": 10},
        headers=headers,
    )
    assert criado.status_code == 201
    produto_id = criado.json()["id"]

    resposta = client.get(f"/api/produtos/{produto_id}")
    assert resposta.status_code == 200
    assert resposta.json()["nome"] == "Notebook"

    atualizado = client.put(
        f"/api/produtos/{produto_id}",
        json={"nome": "Notebook Pro", "descricao": "32GB RAM", "preco": 4800.0, "estoque": 5},
        headers=headers,
    )
    assert atualizado.status_code == 200
    assert atualizado.json()["preco"] == 4800.0

    removido = client.delete(f"/api/produtos/{produto_id}", headers=headers)
    assert removido.status_code == 204

    resposta_final = client.get(f"/api/produtos/{produto_id}")
    assert resposta_final.status_code == 404


def test_frontend_e_servido_na_raiz(client):
    resposta = client.get("/")
    assert resposta.status_code == 200
    assert "text/html" in resposta.headers["content-type"]
