// Painel de Produtos — consome a API REST (FastAPI) definida em app/main.py.
// Sem framework: DOM direto + fetch. Token guardado em sessionStorage
// (sobrevive a um refresh da aba, mas não é enviado a mais ninguém).

const API = "";
const TOKEN_KEY = "painel_produtos_token";
const USER_KEY = "painel_produtos_user";
const STOCK_LOW_THRESHOLD = 5;

const els = {
  connDot: document.getElementById("conn-dot"),
  connLabel: document.getElementById("conn-label"),
  sessionInfo: document.getElementById("session-info"),
  sessionUser: document.getElementById("session-user"),
  btnLogout: document.getElementById("btn-logout"),

  loginPanel: document.getElementById("login-panel"),
  loginForm: document.getElementById("login-form"),
  loginMessage: document.getElementById("login-message"),
  loginSubmit: document.getElementById("login-submit"),

  productFormPanel: document.getElementById("product-form-panel"),
  productForm: document.getElementById("product-form"),
  productFormTitle: document.getElementById("product-form-title"),
  productFormHint: document.getElementById("product-form-hint"),
  productFormMessage: document.getElementById("product-form-message"),
  productId: document.getElementById("product-id"),
  productNome: document.getElementById("product-nome"),
  productDescricao: document.getElementById("product-descricao"),
  productPreco: document.getElementById("product-preco"),
  productEstoque: document.getElementById("product-estoque"),
  productSubmit: document.getElementById("product-submit"),
  productCancelEdit: document.getElementById("product-cancel-edit"),

  ledgerCount: document.getElementById("ledger-count"),
  ledgerBody: document.getElementById("ledger-body"),
  ledgerEmpty: document.getElementById("ledger-empty"),
  ledgerLoading: document.getElementById("ledger-loading"),
  ledgerMessage: document.getElementById("ledger-message"),
  btnRefresh: document.getElementById("btn-refresh"),
};

let state = {
  token: sessionStorage.getItem(TOKEN_KEY) || null,
  username: sessionStorage.getItem(USER_KEY) || null,
  produtos: [],
};

// ---------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mostrarMensagem(el, texto, tipo) {
  el.textContent = texto;
  el.hidden = false;
  el.classList.remove("is-error", "is-success");
  el.classList.add(tipo === "erro" ? "is-error" : "is-success");
}

function ocultarMensagem(el) {
  el.hidden = true;
  el.textContent = "";
}

async function chamarApi(caminho, opcoes = {}) {
  const resposta = await fetch(API + caminho, opcoes);
  let corpo = null;
  const texto = await resposta.text();
  if (texto) {
    try { corpo = JSON.parse(texto); } catch (_) { corpo = null; }
  }
  if (!resposta.ok) {
    const detalhe = (corpo && corpo.detail) || `Erro ${resposta.status}`;
    const erro = new Error(typeof detalhe === "string" ? detalhe : JSON.stringify(detalhe));
    erro.status = resposta.status;
    throw erro;
  }
  return corpo;
}

// ---------------------------------------------------------------
// Conexão com a API
// ---------------------------------------------------------------

async function verificarConexao() {
  try {
    await chamarApi("/status");
    els.connDot.className = "conn-dot online";
    els.connLabel.textContent = "API conectada";
  } catch (_) {
    els.connDot.className = "conn-dot offline";
    els.connLabel.textContent = "API offline — rode: uvicorn app.main:app --reload";
  }
}

// ---------------------------------------------------------------
// Sessão / autenticação
// ---------------------------------------------------------------

function estaLogado() {
  return Boolean(state.token);
}

function aplicarEstadoSessao() {
  if (estaLogado()) {
    els.sessionInfo.hidden = false;
    els.sessionUser.textContent = state.username;
    els.loginPanel.hidden = true;
    els.productFormPanel.hidden = false;
  } else {
    els.sessionInfo.hidden = true;
    els.loginPanel.hidden = false;
    els.productFormPanel.hidden = true;
    cancelarEdicao();
  }
  renderizarLinhas(); // ações da tabela dependem do login
}

async function login(username, password) {
  const corpo = new URLSearchParams({ username, password });
  const resposta = await fetch(API + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: corpo,
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.detail || "Usuário ou senha incorretos");
  }
  state.token = dados.access_token;
  state.username = username;
  sessionStorage.setItem(TOKEN_KEY, state.token);
  sessionStorage.setItem(USER_KEY, state.username);
}

function logout() {
  state.token = null;
  state.username = null;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  aplicarEstadoSessao();
}

els.loginForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  ocultarMensagem(els.loginMessage);
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  els.loginSubmit.disabled = true;
  try {
    await login(username, password);
    els.loginForm.reset();
    aplicarEstadoSessao();
  } catch (erro) {
    mostrarMensagem(els.loginMessage, erro.message, "erro");
  } finally {
    els.loginSubmit.disabled = false;
  }
});

els.btnLogout.addEventListener("click", logout);

// ---------------------------------------------------------------
// Carregar e renderizar produtos (rota pública)
// ---------------------------------------------------------------

async function carregarProdutos({ destacarId } = {}) {
  els.ledgerLoading.hidden = false;
  ocultarMensagem(els.ledgerMessage);
  try {
    const dados = await chamarApi("/api/produtos");
    state.produtos = dados;
    renderizarLinhas({ destacarId });
  } catch (erro) {
    mostrarMensagem(els.ledgerMessage, "Não foi possível carregar os produtos. " + erro.message, "erro");
  } finally {
    els.ledgerLoading.hidden = true;
  }
}

function renderizarLinhas({ destacarId } = {}) {
  const corpo = els.ledgerBody;
  corpo.innerHTML = "";

  els.ledgerCount.textContent = `(${state.produtos.length})`;
  els.ledgerEmpty.hidden = state.produtos.length !== 0;

  for (const produto of state.produtos) {
    const linha = document.createElement("tr");
    if (produto.id === destacarId) linha.classList.add("is-new");

    const estoqueBaixo = produto.estoque <= STOCK_LOW_THRESHOLD;

    linha.innerHTML = `
      <td>
        <span class="cell-name">${escapeHtml(produto.nome)}</span>
        ${produto.descricao ? `<span class="cell-desc">${escapeHtml(produto.descricao)}</span>` : ""}
      </td>
      <td class="num">${formatarPreco(produto.preco)}</td>
      <td class="num">${estoqueBaixo ? `<span class="stock-low">${produto.estoque}</span>` : produto.estoque}</td>
      <td class="actions"></td>
    `;

    const celulaAcoes = linha.querySelector(".actions");
    if (estaLogado()) {
      celulaAcoes.appendChild(criarBotoesAcao(produto));
    } else {
      const nota = document.createElement("span");
      nota.className = "read-only-note";
      nota.textContent = "somente leitura";
      celulaAcoes.appendChild(nota);
    }

    corpo.appendChild(linha);
  }
}

function criarBotoesAcao(produto) {
  const wrap = document.createElement("span");

  const btnEditar = document.createElement("button");
  btnEditar.type = "button";
  btnEditar.className = "btn-row-action";
  btnEditar.textContent = "Editar";
  btnEditar.addEventListener("click", () => iniciarEdicao(produto));

  const btnExcluir = document.createElement("button");
  btnExcluir.type = "button";
  btnExcluir.className = "btn-row-action danger";
  btnExcluir.textContent = "Excluir";

  let confirmando = false;
  let timeoutId = null;

  btnExcluir.addEventListener("click", async () => {
    if (!confirmando) {
      confirmando = true;
      btnExcluir.textContent = "Confirmar?";
      btnExcluir.classList.add("confirm");
      timeoutId = setTimeout(() => {
        confirmando = false;
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.remove("confirm");
      }, 3000);
      return;
    }
    clearTimeout(timeoutId);
    btnExcluir.disabled = true;
    btnEditar.disabled = true;
    try {
      await excluirProduto(produto.id);
    } catch (erro) {
      mostrarMensagem(els.ledgerMessage, "Não foi possível excluir: " + erro.message, "erro");
      btnExcluir.disabled = false;
      btnEditar.disabled = false;
      confirmando = false;
      btnExcluir.textContent = "Excluir";
      btnExcluir.classList.remove("confirm");
    }
  });

  wrap.appendChild(btnEditar);
  wrap.appendChild(document.createTextNode(" "));
  wrap.appendChild(btnExcluir);
  return wrap;
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// ---------------------------------------------------------------
// Formulário de produto (criar / editar)
// ---------------------------------------------------------------

function iniciarEdicao(produto) {
  els.productId.value = produto.id;
  els.productNome.value = produto.nome;
  els.productDescricao.value = produto.descricao || "";
  els.productPreco.value = produto.preco;
  els.productEstoque.value = produto.estoque;

  els.productFormTitle.textContent = "Editar produto";
  els.productFormHint.textContent = `Alterando "${produto.nome}". Salve para aplicar as mudanças.`;
  els.productSubmit.querySelector(".btn-label").textContent = "Salvar alterações";
  els.productCancelEdit.hidden = false;
  ocultarMensagem(els.productFormMessage);
  els.productNome.focus();
}

function cancelarEdicao() {
  els.productForm.reset();
  els.productId.value = "";
  els.productFormTitle.textContent = "Novo produto";
  els.productFormHint.textContent = "Preencha os dados e salve para adicionar ao estoque.";
  els.productSubmit.querySelector(".btn-label").textContent = "Salvar produto";
  els.productCancelEdit.hidden = true;
  ocultarMensagem(els.productFormMessage);
}

els.productCancelEdit.addEventListener("click", cancelarEdicao);

els.productForm.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  ocultarMensagem(els.productFormMessage);

  const payload = {
    nome: els.productNome.value.trim(),
    descricao: els.productDescricao.value.trim() || null,
    preco: parseFloat(els.productPreco.value),
    estoque: parseInt(els.productEstoque.value, 10),
  };

  if (!payload.nome) {
    mostrarMensagem(els.productFormMessage, "Informe o nome do produto.", "erro");
    return;
  }
  if (!(payload.preco > 0)) {
    mostrarMensagem(els.productFormMessage, "O preço deve ser maior que zero.", "erro");
    return;
  }
  if (!(payload.estoque >= 0)) {
    mostrarMensagem(els.productFormMessage, "O estoque não pode ser negativo.", "erro");
    return;
  }

  const idEmEdicao = els.productId.value;
  els.productSubmit.disabled = true;
  try {
    let produtoSalvo;
    if (idEmEdicao) {
      produtoSalvo = await chamarApi(`/api/produtos/${idEmEdicao}`, {
        method: "PUT",
        headers: cabecalhosAutenticados(),
        body: JSON.stringify(payload),
      });
      mostrarMensagem(els.ledgerMessage, `"${produtoSalvo.nome}" atualizado.`, "sucesso");
    } else {
      produtoSalvo = await chamarApi("/api/produtos", {
        method: "POST",
        headers: cabecalhosAutenticados(),
        body: JSON.stringify(payload),
      });
      mostrarMensagem(els.ledgerMessage, `"${produtoSalvo.nome}" adicionado ao estoque.`, "sucesso");
    }
    cancelarEdicao();
    await carregarProdutos({ destacarId: produtoSalvo.id });
  } catch (erro) {
    mostrarMensagem(els.productFormMessage, erro.message, "erro");
  } finally {
    els.productSubmit.disabled = false;
  }
});

async function excluirProduto(id) {
  await chamarApi(`/api/produtos/${id}`, {
    method: "DELETE",
    headers: cabecalhosAutenticados(),
  });
  mostrarMensagem(els.ledgerMessage, "Produto removido.", "sucesso");
  await carregarProdutos();
}

function cabecalhosAutenticados() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${state.token}`,
  };
}

// ---------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------

els.btnRefresh.addEventListener("click", () => carregarProdutos());

(async function iniciar() {
  aplicarEstadoSessao();
  await Promise.all([verificarConexao(), carregarProdutos()]);
})();
