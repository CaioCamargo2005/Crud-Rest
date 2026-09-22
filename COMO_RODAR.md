# Como rodar

## 1. Extrair/clonar e entrar na pasta

```bash
cd rest-api-produtos
```

## 2. Criar e ativar o ambiente virtual

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

## 3. Instalar as dependências

```bash
pip install -r requirements.txt
```

## 4. Rodar o servidor

```bash
uvicorn app.main:app --reload
```

## 5. Abrir no navegador

```
http://localhost:8000
```

Já cai direto no painel — não precisa ir no `/docs`.

## 6. Entrar para editar produtos

- Usuário: `admin`
- Senha: `admin123`

Para parar o servidor: `Ctrl+C` no terminal.

> **Próxima vez:** só repita os passos 2 (ativar venv) e 4 (rodar servidor) —
> não precisa reinstalar nada.

---

## Rodar os testes automatizados

```bash
pytest tests/ -v
```
