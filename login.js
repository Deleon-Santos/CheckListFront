const URL_API = 'http://127.0.0.1:5000';
const chaveToken = 'checklistfront_token';
const chaveUsuario = 'checklistfront_user';

const secaoAutenticacao = document.getElementById('authSection');
const secaoDashboard = document.getElementById('dashboardSection');
const botaoLogout = document.getElementById('logoutButton');
const botaoMostrarLogin = document.getElementById('showLogin');
const botaoMostrarCadastro = document.getElementById('showRegister');
const formularioLogin = document.getElementById('loginForm');
const formularioCadastro = document.getElementById('registerForm');
const mensagemLogin = document.getElementById('loginMessage');
const mensagemCadastro = document.getElementById('registerMessage');
const formularioTarefa = document.getElementById('taskForm');
const mensagemTarefa = document.getElementById('taskMessage');
const botaoLimparTarefa = document.getElementById('resetTask');
const listaTarefas = document.getElementById('taskList');
const abaAtivas = document.getElementById('tabActive');
const abaConcluidas = document.getElementById('tabCompleted');
const abaExcluidas = document.getElementById('tabDeleted');
const resumoAtivas = document.getElementById('summaryActive');
const resumoConcluidas = document.getElementById('summaryCompleted');
const resumoExcluidas = document.getElementById('summaryDeleted');
const alertaToast = document.getElementById('toast');

let tarefas = [];
let modoVisualizacao = 'active';
let tarefaEditando = null;

// Campos do formulário de tarefa
const elementosFormularioTarefa = {
  titulo: document.getElementById('taskTitle'),
  descricao: document.getElementById('taskDescription'),
  dataVencimento: document.getElementById('taskDueDate'),
  prioridade: document.getElementById('taskPriority'),
};

// Campos do formulário de usuário para login e cadastro
const camposUsuario = {
  cadastro: {
    nome: document.getElementById('registerName'),
    email: document.getElementById('registerEmail'),
    senha: document.getElementById('registerPassword'),
  },
  login: {
    email: document.getElementById('loginEmail'),
    senha: document.getElementById('loginPassword'),
  },
};

// Alterna entre a seção de autenticação e o dashboard
function mostrarSecao(secao) {
  secaoAutenticacao.classList.toggle('hidden', secao !== 'auth');
  secaoDashboard.classList.toggle('hidden', secao !== 'dashboard');
  botaoLogout.hidden = secao !== 'dashboard';
}

// Define a aba ativa do painel de tarefas
function definirAbaAtiva(aba) {
  modoVisualizacao = aba;
  abaAtivas.classList.toggle('active', aba === 'active');
  abaConcluidas.classList.toggle('active', aba === 'completed');
  abaExcluidas.classList.toggle('active', aba === 'deleted');
  renderizarTarefas();
}

// Alterna entre a aba de login e cadastro
function definirAbaAutenticacao(aba) {
  botaoMostrarLogin.classList.toggle('active', aba === 'login');
  botaoMostrarCadastro.classList.toggle('active', aba === 'register');
  formularioLogin.classList.toggle('hidden', aba !== 'login');
  formularioCadastro.classList.toggle('hidden', aba !== 'register');
  mensagemLogin.textContent = '';
  mensagemCadastro.textContent = '';
}

// Recupera o token armazenado no localStorage
function obterTokenArmazenado() {
  return localStorage.getItem(chaveToken) || '';
}

// Salva ou remove o token e usuário do localStorage
function definirTokenArmazenado(token) {
  if (token) {
    localStorage.setItem(chaveToken, token);
  } else {
    localStorage.removeItem(chaveToken);
    localStorage.removeItem(chaveUsuario);
  }
}

// Recupera o usuário armazenado no localStorage
function obterUsuarioArmazenado() {
  try {
    return JSON.parse(localStorage.getItem(chaveUsuario) || '{}');
  } catch {
    return {};
  }
}

// Retorna os headers de autenticação para as requisições
function obterCabecalhosAutenticacao() {
  const token = obterTokenArmazenado();
  console.log('Token atual:', token);
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

// Exibe uma mensagem rápida no topo da interface
function exibirToast(mensagem, tipo = 'info') {
  alertaToast.textContent = mensagem;
  alertaToast.style.background = tipo === 'error' ? 'rgba(220, 38, 38, 0.94)' : 'rgba(15, 23, 42, 0.95)';
  alertaToast.classList.remove('hidden');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => alertaToast.classList.add('hidden'), 3800);
}

// Faz requisições HTTP e trata respostas JSON
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

// Processa o envio do formulário de login
async function loginUsuario(event) {
  event.preventDefault();
  mensagemLogin.textContent = '';

  const payload = {
    email: camposUsuario.login.email.value.trim(),
    senha: camposUsuario.login.senha.value,
  };

  if (!payload.email || !payload.senha) {
    mensagemLogin.textContent = 'Informe email e senha.';
    return;
  }

  try {
    const data = await requisicaoJson(`${URL_API}/login`, {
      method: 'POST',
      headers: obterCabecalhosAutenticacao(),
      body: JSON.stringify(payload),
    });

    definirTokenArmazenado(data.access_token);
    localStorage.setItem(chaveUsuario, JSON.stringify(data.user || { email: payload.email }));
    exibirToast('Login realizado com sucesso.');
    await entrarDashboard();
  } catch (error) {
    mensagemLogin.textContent = error.message;
  }
}

// Processa o cadastro de novo usuário
async function cadastrarUsuario(event) {
  event.preventDefault();
  mensagemCadastro.textContent = '';

  const payload = {
    nome: camposUsuario.cadastro.nome.value.trim(),
    email: camposUsuario.cadastro.email.value.trim(),
    senha: camposUsuario.cadastro.senha.value,
  };

  if (!payload.nome || !payload.email || !payload.senha) {
    mensagemCadastro.textContent = 'Preencha todos os campos obrigatórios.';
    return;
  }

  try {
    const data = await requisicaoJson(`${URL_API}/cadastro`, {
      method: 'POST',
      headers: obterCabecalhosAutenticacao(),
      body: JSON.stringify(payload),
    });

    definirTokenArmazenado(data.access_token);
    localStorage.setItem(chaveUsuario, JSON.stringify(data.user || {
      email: payload.email,
      nome: payload.nome,
      senha: payload.senha,
    }));
    exibirToast('Conta criada com sucesso.');
    await entrarDashboard();
  } catch (error) {
    mensagemCadastro.textContent = error.message;
  }
}

// Mostra o dashboard e carrega as tarefas do usuário
async function entrarDashboard() {
  mostrarSecao('dashboard');
  await carregarTarefas();
}

// Busca as tarefas do usuário no backend
async function carregarTarefas() {
  try {
    const data = await requisicaoJson(`${URL_API}/lembrete`, {
      method: 'GET',
      headers: obterCabecalhosAutenticacao(),
    });

    console.log('Resposta da API:', data);
    tarefas = Array.isArray(data) ? data : [];
    console.log('Tarefas carregadas:', tarefas);

    renderizarTarefas();
  } catch (error) {
    tratarErroAutenticacao(error);
  }
}

// Monta um cartão visual para cada tarefa
function montarCartaoTarefa(tarefa) {
  const statusAtual = String(tarefa.status || '').toLowerCase();
  const estaConcluida = statusAtual === 'concluído' || statusAtual === 'concluido';
  const estaExcluida = statusAtual === 'excluído' || statusAtual === 'excluido';
  const estaAtiva = statusAtual === 'ativo';

  const cartao = document.createElement('article');
  cartao.className = `task-card ${estaExcluida ? 'deleted' : estaConcluida ? 'completed' : 'active'}`;

  const titulo = document.createElement('h3');
  titulo.className = `task-title ${estaConcluida ? 'completed' : ''}`;
  titulo.textContent = tarefa.titulo || tarefa.title || '';

  const descricao = document.createElement('p');
  descricao.className = 'task-description';
  descricao.textContent = tarefa.descricao || tarefa.description || 'Sem descrição adicional';

  const rotulos = document.createElement('div');
  rotulos.className = 'task-labels';

  const etiquetaStatus = document.createElement('span');
  etiquetaStatus.className = `tag ${estaExcluida ? 'status-deleted' : estaConcluida ? 'status-completed' : 'status-active'}`;
  etiquetaStatus.textContent = tarefa.status || (estaExcluida ? 'Excluído' : estaConcluida ? 'Concluído' : 'Ativo');
  rotulos.appendChild(etiquetaStatus);

  const acoes = document.createElement('div');
  acoes.className = 'task-actions';

  const botaoAlternar = document.createElement('button');
  botaoAlternar.className = `action-button ${estaAtiva ? 'success' : ''}`;
  botaoAlternar.type = 'button';
  botaoAlternar.textContent = estaExcluida ? 'Restaurar tarefa' : estaAtiva ? 'Marcar como concluída' : 'Reativar tarefa';
  botaoAlternar.addEventListener('click', () => alternarStatusTarefa(tarefa));
  acoes.appendChild(botaoAlternar);

  const botaoEditar = document.createElement('button');
  botaoEditar.className = 'action-button';
  botaoEditar.type = 'button';
  botaoEditar.textContent = 'Editar';
  botaoEditar.disabled = estaExcluida;
  if (!estaExcluida) {
    botaoEditar.addEventListener('click', () => preencherFormularioTarefa(tarefa));
  }
  acoes.appendChild(botaoEditar);

  const botaoExcluir = document.createElement('button');
  botaoExcluir.className = 'action-button danger';
  botaoExcluir.type = 'button';
  botaoExcluir.textContent = estaExcluida ? 'Excluir permanentemente' : 'Mover para lixeira';
  botaoExcluir.addEventListener('click', () => removerTarefa(tarefa));
  acoes.appendChild(botaoExcluir);

  cartao.append(titulo, descricao, rotulos, acoes);
  return cartao;
}

// Renderiza a lista de tarefas e os resumos de status
function renderizarTarefas() {
  listaTarefas.innerHTML = '';
  const tarefasFiltradas = tarefas.filter((tarefa) => {
    const status = String(tarefa.status || '').toLowerCase();
    const estaConcluida = status === 'concluído' || status === 'concluido';
    const estaExcluida = status === 'excluído' || status === 'excluido';
    return modoVisualizacao === 'active'
      ? status === 'ativo'
      : modoVisualizacao === 'completed'
      ? estaConcluida
      : estaExcluida;
  });

  resumoAtivas.textContent = tarefas.filter((tarefa) => String(tarefa.status || '').toLowerCase() === 'ativo').length;
  resumoConcluidas.textContent = tarefas.filter((tarefa) => {
    const status = String(tarefa.status || '').toLowerCase();
    return status === 'concluído' || status === 'concluido';
  }).length;
  resumoExcluidas.textContent = tarefas.filter((tarefa) => {
    const status = String(tarefa.status || '').toLowerCase();
    return status === 'excluído' || status === 'excluido';
  }).length;

  if (!tarefasFiltradas.length) {
    const vazio = document.createElement('div');
    vazio.className = 'task-card';
    const mensagem = modoVisualizacao === 'active' ? 'ativa' : modoVisualizacao === 'completed' ? 'concluída' : 'excluída';
    vazio.innerHTML = `<p class="task-description">Nenhuma tarefa ${mensagem} no momento.</p>`;
    listaTarefas.appendChild(vazio);
    return;
  }

  tarefasFiltradas.forEach((tarefa) => listaTarefas.appendChild(montarCartaoTarefa(tarefa)));
}

// Limpa o formulário de tarefa e reseta o estado de edição
function limparFormularioTarefa() {
  formularioTarefa.reset();
  tarefaEditando = null;
  mensagemTarefa.textContent = '';
  formularioTarefa.querySelector('button[type="submit"]').textContent = 'Salvar tarefa';
}

// Preenche o formulário com os dados da tarefa selecionada para edição
function preencherFormularioTarefa(tarefa) {
  tarefaEditando = tarefa;
  elementosFormularioTarefa.titulo.value = tarefa.titulo || tarefa.title || '';
  elementosFormularioTarefa.descricao.value = tarefa.descricao || tarefa.description || '';
  elementosFormularioTarefa.dataVencimento.value = tarefa.due_date || tarefa.vencimento || '';
  elementosFormularioTarefa.prioridade.value = tarefa.prioridade || tarefa.priority || 'Média';

  formularioTarefa.querySelector('button[type="submit"]').textContent = 'Atualizar tarefa';
  mensagemTarefa.textContent = '';
  elementosFormularioTarefa.titulo.focus();
}

// Envia os dados de criação ou edição de tarefa ao backend
async function enviarFormularioTarefa(event) {
  event.preventDefault();
  mensagemTarefa.textContent = '';

  const payload = {
    titulo: elementosFormularioTarefa.titulo.value.trim(),
    descricao: elementosFormularioTarefa.descricao.value.trim(),
    due_date: elementosFormularioTarefa.dataVencimento.value || null,
    prioridade: elementosFormularioTarefa.prioridade.value || 'Média',
    status: tarefaEditando?.status || 'ativo',
    user: obterUsuarioArmazenado().email || obterUsuarioArmazenado().nome || null,
  };

  if (!payload.titulo) {
    mensagemTarefa.textContent = 'O título da tarefa é obrigatório.';
    return;
  }

  try {
    const url = tarefaEditando ? `${URL_API}/atualiza_id/${tarefaEditando.id}` : `${URL_API}/lembrete`;
    const method = tarefaEditando ? 'PUT' : 'POST';
    const tarefaSalva = await requisicaoJson(url, {
      method,
      headers: obterCabecalhosAutenticacao(),
      body: JSON.stringify(payload),
    });

    if (tarefaEditando) {
      tarefas = tarefas.map((tarefa) => (tarefa.id === tarefaSalva.id ? tarefaSalva : tarefa));
      exibirToast('Tarefa atualizada com sucesso.');
    } else {
      tarefas.unshift(tarefaSalva);
      exibirToast('Tarefa criada com sucesso.');
    }

    limparFormularioTarefa();
    renderizarTarefas();
  } catch (error) {
    tratarErroAutenticacao(error);
    mensagemTarefa.textContent = error.message;
  }
}

// Altera o status da tarefa entre ativa e concluída
async function alternarStatusTarefa(tarefa) {
  const statusAtual = String(tarefa.status || '').toLowerCase();
  const proximoStatus = statusAtual === 'ativo' ? 'concluído' : statusAtual === 'concluído' || statusAtual === 'concluido' ? 'ativo' : 'ativo';

  try {
    const tarefaAtualizada = await requisicaoJson(`${URL_API}/atualiza_id/${tarefa.id}`, {
      method: 'PUT',
      headers: obterCabecalhosAutenticacao(),
      body: JSON.stringify({
        titulo: tarefa.titulo || tarefa.title,
        descricao: tarefa.descricao || tarefa.description || '',
        status: proximoStatus,
      }),
    });

    tarefas = tarefas.map((item) => (item.id === tarefaAtualizada.id ? tarefaAtualizada : item));
    const mensagemStatus = proximoStatus.toLowerCase().includes('concl') ? 'concluída' : 'reativada';
    exibirToast(`Tarefa ${mensagemStatus} com sucesso.`);
    renderizarTarefas();
  } catch (error) {
    tratarErroAutenticacao(error);
  }
}

// Remove ou move tarefa para lixeira, dependendo do status atual
async function removerTarefa(tarefa) {
  const statusAtual = String(tarefa.status || '').toLowerCase();
  const estaExcluida = statusAtual === 'excluído' || statusAtual === 'excluido';
  const tituloTarefa = tarefa.titulo || tarefa.title || '';
  const confirmado = confirm(
    estaExcluida
      ? `Excluir permanentemente a tarefa "${tituloTarefa}"? Esta ação não pode ser desfeita.`
      : `Mover a tarefa "${tituloTarefa}" para a lixeira?`
  );

  if (!confirmado) return;

  try {
    if (estaExcluida) {
      await requisicaoJson(`${URL_API}/deleta_id/${tarefa.id}`, {
        method: 'DELETE',
        headers: obterCabecalhosAutenticacao(),
      });
      tarefas = tarefas.filter((item) => item.id !== tarefa.id);
      exibirToast('Tarefa excluída permanentemente.');
    } else {
      const tarefaAtualizada = await requisicaoJson(`${URL_API}/atualiza_id/${tarefa.id}`, {
        method: 'PUT',
        headers: obterCabecalhosAutenticacao(),
        body: JSON.stringify({
          titulo: tarefa.titulo || tarefa.title,
          descricao: tarefa.descricao || tarefa.description || '',
          status: 'excluído',
        }),
      });
      tarefas = tarefas.map((item) => (item.id === tarefaAtualizada.id ? tarefaAtualizada : item));
      exibirToast('Tarefa movida para a lixeira.');
    }
    renderizarTarefas();
  } catch (error) {
    tratarErroAutenticacao(error);
  }
}

// Trata erros de autenticação e força logout quando o token expira
function tratarErroAutenticacao(error) {
  if (error.message.toLowerCase().includes('token') || error.message.toLowerCase().includes('autoriz')) {
    definirTokenArmazenado('');
    mostrarSecao('auth');
    definirAbaAutenticacao('login');
    exibirToast('Sessão expirada. Faça login novamente.', 'error');
  } else {
    exibirToast(error.message, 'error');
  }
}

// Efetua logout e volta para a tela de autenticação
function sair() {
  definirTokenArmazenado('');
  tarefas = [];
  limparFormularioTarefa();
  mostrarSecao('auth');
  definirAbaAutenticacao('login');
  exibirToast('Logout realizado com sucesso.');
}

// Inicializa os eventos e o estado inicial da aplicação
function inicializar() {
  definirAbaAutenticacao('login');
  mostrarSecao(obterTokenArmazenado() ? 'dashboard' : 'auth');

  if (obterTokenArmazenado()) {
    entrarDashboard().catch(() => {
      definirTokenArmazenado('');
      mostrarSecao('auth');
    });
  }

  botaoMostrarLogin.addEventListener('click', () => definirAbaAutenticacao('login'));
  botaoMostrarCadastro.addEventListener('click', () => definirAbaAutenticacao('register'));
  formularioLogin.addEventListener('submit', loginUsuario);
  formularioCadastro.addEventListener('submit', cadastrarUsuario);
  formularioTarefa.addEventListener('submit', enviarFormularioTarefa);
  botaoLimparTarefa.addEventListener('click', limparFormularioTarefa);
  botaoLogout.addEventListener('click', sair);
  abaAtivas.addEventListener('click', () => definirAbaAtiva('active'));
  abaConcluidas.addEventListener('click', () => definirAbaAtiva('completed'));
  abaExcluidas.addEventListener('click', () => definirAbaAtiva('deleted'));
}

inicializar();
