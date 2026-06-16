const API_BASE = 'http://127.0.0.1:5000';
const tokenKey = 'checklistfront_token';
const userKey = 'checklistfront_user';

const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const logoutButton = document.getElementById('logoutButton');
const showLogin = document.getElementById('showLogin');
const showRegister = document.getElementById('showRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const taskForm = document.getElementById('taskForm');
const taskMessage = document.getElementById('taskMessage');
const resetTask = document.getElementById('resetTask');
const taskList = document.getElementById('taskList');
const tabActive = document.getElementById('tabActive');
const tabCompleted = document.getElementById('tabCompleted');
const summaryActive = document.getElementById('summaryActive');
const summaryCompleted = document.getElementById('summaryCompleted');
const toast = document.getElementById('toast');

let tasks = [];
let viewMode = 'active';
let editingTask = null;

// campos de formulario para criação do lembrete
const taskFormElements = {
  title: document.getElementById('taskTitle'),
  description: document.getElementById('taskDescription'),
  due_date: document.getElementById('taskDueDate'),
  priority: document.getElementById('taskPriority'),
};

//campos de formulario para cadastrar e logar usuario
const userFields = {
  register: {
    name: document.getElementById('registerName'),
    email: document.getElementById('registerEmail'),
    password: document.getElementById('registerPassword'),
  },
  login: {
    email: document.getElementById('loginEmail'),
    password: document.getElementById('loginPassword'),
  },
};

//tela de login e dashboard
function showSection(section) {
  authSection.classList.toggle('hidden', section !== 'auth');
  dashboardSection.classList.toggle('hidden', section !== 'dashboard');
  logoutButton.hidden = section !== 'dashboard';
}

//sessão pa ativos e concluidos
function setActiveTab(tab) {
  viewMode = tab;
  tabActive.classList.toggle('active', tab === 'active');
  tabCompleted.classList.toggle('active', tab === 'completed');
  renderTasks();
}

//tela de login e cadastro
function setAuthTab(tab) {
  showLogin.classList.toggle('active', tab === 'login');
  showRegister.classList.toggle('active', tab === 'register');
  loginForm.classList.toggle('hidden', tab !== 'login');
  registerForm.classList.toggle('hidden', tab !== 'register');
  loginMessage.textContent = '';
  registerMessage.textContent = '';
}

//funções para pegar token e autenticação
function getStoredToken() {
  return localStorage.getItem(tokenKey) || '';
}

//função para setar o token no local storage, se o token for vazio ele remove o token e o usuário
function setStoredToken(token) {
  if (token) {
    localStorage.setItem(tokenKey, token);
  } else {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
  }
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(userKey) || '{}');
  } catch {
    return {};
  }
}

//função para pegar os headers de autenticação, se tiver token ele retorna o header com o token, se não retorna apenas o header com content-type
function getAuthHeaders() {
  const token = getStoredToken();
  console.log('Token atual:', token);
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

//função para mostrar mensagens de sucesso ou erro, o tipo pode ser 'info' ou 'error', o tipo 'error' tem um fundo vermelho, o tipo 'info' tem um fundo azul escuro
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.style.background = type === 'error' ? 'rgba(220, 38, 38, 0.94)' : 'rgba(15, 23, 42, 0.95)';
  toast.classList.remove('hidden');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.add('hidden'), 3800);
}


async function requestJson(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await response.json() : null;
    if (!response.ok) {
      const message = body?.detail || body?.message || 'Erro ao comunicar com o servidor';
      throw new Error(message);
    }
    return body;
  } catch (error) {
    throw new Error(error.message || 'Erro de rede.');
  }
}

//abri comunicação com o backend para logar o usuario
async function loginUser(event) {
  event.preventDefault();
  loginMessage.textContent = '';
  const payload = {
    email: userFields.login.email.value.trim(),
    senha: userFields.login.password.value,
  };

  if (!payload.email || !payload.senha) {
    loginMessage.textContent = 'Informe email e senha.';
    return;
  }

  try {
    const data = await requestJson(`${API_BASE}/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    setStoredToken(data.access_token);
    localStorage.setItem(userKey, JSON.stringify(data.user || { email: payload.email }));
    showToast('Login realizado com sucesso.');
    await enterDashboard();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
}

//abre comunicaçõ com a api de cadastro de usuario
async function registerUser(event) {
  event.preventDefault();
  registerMessage.textContent = '';
  const payload = {
    nome: userFields.register.name.value.trim(),
    email: userFields.register.email.value.trim(),
    senha: userFields.register.password.value,
  };

  if (!payload.nome || !payload.email || !payload.senha) {
    registerMessage.textContent = 'Preencha todos os campos obrigatórios.';
    return;
  }

  try {
    const data = await requestJson(`${API_BASE}/cadastro`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    setStoredToken(data.access_token);
    localStorage.setItem(userKey, JSON.stringify(data.user || { email: payload.email, nome: payload.nome, senha: payload.senha }));
    showToast('Conta criada com sucesso.');
    await enterDashboard();
  } catch (error) {
    registerMessage.textContent = error.message;
  }
}

//função para entrar no dashboard, ela mostra a seção do dashboard e carrega as tarefas do usuário
async function enterDashboard() {
  showSection('dashboard');
  await loadTasks();
}

async function loadTasks() {
  try {
    const data = await requestJson(`${API_BASE}/lembrete`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    console.log('Resposta da API:', data);
    tasks = Array.isArray(data) ? data : [];
    console.log('Tarefas carregadas:', tasks);

    renderTasks();
  } catch (error) {
    handleAuthError(error);
  }
}

//renderizar os cards de tarefas armazenadas
function buildTaskCard(task) {
  const currentStatus = String(task.status || '').toLowerCase();
  const isCompleted = currentStatus === 'concluído' || currentStatus === 'concluido';
  const isActive = currentStatus === 'ativo';

  const card = document.createElement('article');
  card.className = `task-card ${isCompleted ? 'completed' : 'active'}`;

  const title = document.createElement('h3');
  title.className = `task-title ${isCompleted ? 'completed' : ''}`;
  title.textContent = task.title;

  const description = document.createElement('p');
  description.className = 'task-description';
  description.textContent = task.descricao || 'Sem descrição adicional';

  const labels = document.createElement('div');
  labels.className = 'task-labels';

  const statusTag = document.createElement('span');
  statusTag.className = `tag ${isCompleted ? 'status-completed' : 'status-active'}`;
  statusTag.textContent = task.status;
  labels.appendChild(statusTag);


  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const toggleButton = document.createElement('button');
  toggleButton.className = `action-button ${isActive ? 'success' : ''}`;
  toggleButton.type = 'button';
  toggleButton.textContent = isActive ? 'Marcar como concluída' : 'Reativar tarefa';
  toggleButton.addEventListener('click', () => toggleTaskStatus(task));
  actions.appendChild(toggleButton);

  const editButton = document.createElement('button');
  editButton.className = 'action-button';
  editButton.type = 'button';
  editButton.textContent = 'Editar';
  editButton.addEventListener('click', () => populateTaskForm(task));
  actions.appendChild(editButton);

  const deleteButton = document.createElement('button');
  deleteButton.className = 'action-button danger';
  deleteButton.type = 'button';
  deleteButton.textContent = 'Excluir';
  deleteButton.addEventListener('click', () => removeTask(task));
  actions.appendChild(deleteButton);

  card.append(title, description, labels, actions);
  return card;
}

function renderTasks() {
  taskList.innerHTML = '';
  const filtered = tasks.filter((task) => {
    const status = String(task.status || '').toLowerCase();
    const isCompleted = status === 'concluído' || status === 'concluido';
    return viewMode === 'active' ? status === 'ativo' : isCompleted;
  });
  summaryActive.textContent = tasks.filter((task) => String(task.status || '').toLowerCase() === 'ativo').length;
  summaryCompleted.textContent = tasks.filter((task) => {
    const status = String(task.status || '').toLowerCase();
    return status === 'concluído' || status === 'concluido';
  }).length;

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'task-card';
    empty.innerHTML = `<p class="task-description">Nenhuma tarefa ${viewMode === 'active' ? 'ativa' : 'concluída'} no momento.</p>`;
    taskList.appendChild(empty);
    return;
  }

  filtered.forEach((task) => taskList.appendChild(buildTaskCard(task)));
}

function resetTaskForm() {
  taskForm.reset();
  editingTask = null;
  taskMessage.textContent = '';
  taskForm.querySelector('button[type="submit"]').textContent = 'Salvar tarefa';
}

function populateTaskForm(task) {
  editingTask = task;
  taskFormElements.title.value = task.titulo || task.title || '';
  taskFormElements.description.value = task.descricao || task.description || '';
  taskFormElements.due_date.value = task.due_date || task.vencimento || '';
  taskFormElements.priority.value = task.prioridade || task.priority || 'Média';
  
  taskForm.querySelector('button[type="submit"]').textContent = 'Atualizar tarefa';
  taskMessage.textContent = '';
  taskFormElements.title.focus();
}

//adiciona um novo lembrete
async function sendTaskForm(event) {
  event.preventDefault();
  taskMessage.textContent = '';
  const payload = {
    titulo: taskFormElements.title.value.trim(),
    descricao: taskFormElements.description.value.trim(),
    due_date: taskFormElements.due_date.value || null,
    prioridade: taskFormElements.priority.value || 'Média',
    status: editingTask?.status || 'ativo',
    user: getStoredUser().email || getStoredUser().nome || null,
  };

  if (!payload.titulo) {
    taskMessage.textContent = 'O título da tarefa é obrigatório.';
    return;
  }

  try {
    const url = editingTask ? `${API_BASE}/atualiza_id/${editingTask.id}` : `${API_BASE}/lembrete`;
    const method = editingTask ? 'PUT' : 'POST';
    const saved = await requestJson(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (editingTask) {
      tasks = tasks.map((task) => (task.id === saved.id ? saved : task));
      showToast('Tarefa atualizada com sucesso.');
    } else {
      tasks.unshift(saved);
      showToast('Tarefa criada com sucesso.');
    }
    resetTaskForm();
    renderTasks();
  } catch (error) {
    handleAuthError(error);
    taskMessage.textContent = error.message;
  }
}

async function toggleTaskStatus(task) {
  const currentStatus = String(task.status || '').toLowerCase();
  const nextStatus = currentStatus === 'ativo' ? 'concluído' : 'ativo';
  try {
    const updated = await requestJson(`${API_BASE}/atualiza_id/${task.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        titulo: task.titulo || task.title,
        descricao: task.descricao || task.description || '',
        status: nextStatus,
      }),
    });
    tasks = tasks.map((item) => (item.id === updated.id ? updated : item));
    const statusMessage = nextStatus.toLowerCase().includes('concl') ? 'concluída' : 'reativada';
    showToast(`Tarefa ${statusMessage} com sucesso.`);
    renderTasks();
  } catch (error) {
    handleAuthError(error);
  }
}

//função para excluir uma tarefa, ela pede confirmação antes de excluir e depois remove a tarefa da lista e renderiza novamente
async function removeTask(task) {
  const confirmed = confirm(`Excluir a tarefa "${task.title}"? Esta ação não pode ser desfeita.`);
  if (!confirmed) return;
  try {
    await requestJson(`${API_BASE}/deleta_id/${task.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    tasks = tasks.filter((item) => item.id !== task.id);
    showToast('Tarefa excluída com sucesso.');
    renderTasks();
  } catch (error) {
    handleAuthError(error);
  }
}

function handleAuthError(error) {
  if (error.message.toLowerCase().includes('token') || error.message.toLowerCase().includes('autoriz')) {
    setStoredToken('');
    showSection('auth');
    setAuthTab('login');
    showToast('Sessão expirada. Faça login novamente.', 'error');
  } else {
    showToast(error.message, 'error');
  }
}

function logout() {
  setStoredToken('');
  tasks = [];
  resetTaskForm();
  showSection('auth');
  setAuthTab('login');
  showToast('Logout realizado com sucesso.');
}

function initialize() {
  setAuthTab('login');
  showSection(getStoredToken() ? 'dashboard' : 'auth');

  if (getStoredToken()) {
    enterDashboard().catch(() => {
      setStoredToken('');
      showSection('auth');
    });
  }

  showLogin.addEventListener('click', () => setAuthTab('login'));
  showRegister.addEventListener('click', () => setAuthTab('register'));
  loginForm.addEventListener('submit', loginUser);
  registerForm.addEventListener('submit', registerUser);
  taskForm.addEventListener('submit', sendTaskForm);
  resetTask.addEventListener('click', resetTaskForm);
  logoutButton.addEventListener('click', logout);
  tabActive.addEventListener('click', () => setActiveTab('active'));
  tabCompleted.addEventListener('click', () => setActiveTab('completed'));
}

initialize();
