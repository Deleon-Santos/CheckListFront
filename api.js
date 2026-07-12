const URL_API = 'http://127.0.0.1:5000';
const chaveToken = 'checklistfront_token';
const chaveUsuario = 'checklistfront_user';

function obterTokenArmazenado() {
  return localStorage.getItem(chaveToken) || '';
}

function definirTokenArmazenado(token) {
  if (token) {
    localStorage.setItem(chaveToken, token);
  } else {
    localStorage.removeItem(chaveToken);
    localStorage.removeItem(chaveUsuario);
  }
}

function obterUsuarioArmazenado() {
  try {
    return JSON.parse(localStorage.getItem(chaveUsuario) || '{}');
  } catch {
    return {};
  }
}

function obterCabecalhosAutenticacao() {
  const token = obterTokenArmazenado();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function requisicaoJson(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await response.json() : null;

    if (!response.ok) {
      const mensagem = body?.detail || body?.message || 'Erro ao comunicar com o servidor';
      throw new Error(mensagem);
    }

    return body;
  } catch (error) {
    throw new Error(error.message || 'Erro de rede.');
  }
}

async function loginApi(payload) {
  return requisicaoJson(`${URL_API}/login`, {
    method: 'POST',
    headers: obterCabecalhosAutenticacao(),
    body: JSON.stringify(payload),
  });
}

async function cadastrarApi(payload) {
  return requisicaoJson(`${URL_API}/cadastro`, {
    method: 'POST',
    headers: obterCabecalhosAutenticacao(),
    body: JSON.stringify(payload),
  });
}

async function listarTarefasApi() {
  return requisicaoJson(`${URL_API}/lembrete`, {
    method: 'GET',
    headers: obterCabecalhosAutenticacao(),
  });
}

async function criarTarefaApi(payload) {
  return requisicaoJson(`${URL_API}/lembrete`, {
    method: 'POST',
    headers: obterCabecalhosAutenticacao(),
    body: JSON.stringify(payload),
  });
}

async function atualizarTarefaApi(id, payload) {
  return requisicaoJson(`${URL_API}/atualiza_id/${id}`, {
    method: 'PUT',
    headers: obterCabecalhosAutenticacao(),
    body: JSON.stringify(payload),
  });
}

async function excluirTarefaApi(id) {
  return requisicaoJson(`${URL_API}/deleta_id/${id}`, {
    method: 'DELETE',
    headers: obterCabecalhosAutenticacao(),
  });
}

export {
  URL_API,
  chaveToken,
  chaveUsuario,
  obterTokenArmazenado,
  definirTokenArmazenado,
  obterUsuarioArmazenado,
  obterCabecalhosAutenticacao,
  requisicaoJson,
  loginApi,
  cadastrarApi,
  listarTarefasApi,
  criarTarefaApi,
  atualizarTarefaApi,
  excluirTarefaApi,
};
