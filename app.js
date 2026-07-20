import { definirTokenArmazenado, obterTokenArmazenado, listarTarefasApi } from './api.js';
import { createAuthController } from './ui/auth.js';
import { createTaskController } from './ui/tasks.js';

const secaoAutenticacao = document.getElementById('authSection');
const secaoDashboard = document.getElementById('dashboardSection');
const botaoLogout = document.getElementById('logoutButton');
const nomeUsuarioDisplay = document.getElementById('userNameDisplay');
const botaoMostrarLogin = document.getElementById('showLogin');
const botaoMostrarCadastro = document.getElementById('showRegister');
const formularioLogin = document.getElementById('loginForm');
const formularioCadastro = document.getElementById('registerForm');
const alertaToast = document.getElementById('toast');


const authController = createAuthController({
  authSection: secaoAutenticacao,
  dashboardSection: secaoDashboard,
  logoutButton: botaoLogout,
  showLoginButton: botaoMostrarLogin,
  showRegisterButton: botaoMostrarCadastro,
  loginForm: formularioLogin,
  registerForm: formularioCadastro,
  loginMessage: document.getElementById('loginMessage'),
  registerMessage: document.getElementById('registerMessage'),
  toastElement: alertaToast,
  onEnterDashboard: entrarDashboard,
});

const taskController = createTaskController({
  taskForm: document.getElementById('taskForm'),
  taskMessage: document.getElementById('taskMessage'),
  taskList: document.getElementById('taskList'),
  resetTaskButton: document.getElementById('resetTask'),
  tabOpen: document.getElementById('tabOpen'),
  tabAttended: document.getElementById('tabAttended'),
  tabCompleted: document.getElementById('tabCompleted'),
  tabDeleted: document.getElementById('tabDeleted'),
  taskAreaFilter: document.getElementById('taskAreaFilter'),
  summaryActive: document.getElementById('summaryActive'),
  summaryAttended: document.getElementById('summaryAttended'),
  summaryCompleted: document.getElementById('summaryCompleted'),
  summaryDeleted: document.getElementById('summaryDeleted'),
  toastElement: alertaToast,
  getCurrentUser: () => JSON.parse(localStorage.getItem('checklistfront_user') || '{}'),
  onAuthError: tratarErroAutenticacao,
  onLogout: sair,
});

let tarefas = [];

function obterUsuarioAtual() {
  try {
   
    return JSON.parse(localStorage.getItem('checklistfront_user') || '{}');
  } catch {
    return {};
  }
}

function obterNomeExibicao(usuario) {
  const candidatos = [
    usuario?.nome,
    usuario?.name,
    usuario?.username,
    usuario?.full_name,
    usuario?.first_name,
    usuario?.primeiro_nome,
  ];

  for (const candidato of candidatos) {
    if (typeof candidato === 'string' && candidato.trim()) {
      const valor = candidato.trim();
      return valor.includes('@') ? valor.split('@')[0] : valor;
    }
  }

  const email = usuario?.email || usuario?.mail || '';
  if (typeof email === 'string' && email.trim()) {
    const valor = email.trim();
    return valor.includes('@') ? valor.split('@')[0] : valor;
  }

  return '';
}

function atualizarCabecalhoUsuario() {
  const usuario = obterUsuarioAtual();
  const nome = obterNomeExibicao(usuario);
  const temSessao = Boolean(obterTokenArmazenado());

  if (nome && temSessao) {
    nomeUsuarioDisplay.textContent = `Olá, ${nome}`;
    nomeUsuarioDisplay.hidden = false;
  } else {
    nomeUsuarioDisplay.textContent = '';
    nomeUsuarioDisplay.hidden = true;
  }
}

function mostrarSecao(secao) {
  authController.showSection(secao);
  atualizarCabecalhoUsuario();
}

function definirAbaAutenticacao(aba) {
  authController.setAuthTab(aba);
}

function exibirToast(mensagem, tipo = 'info') {
  alertaToast.textContent = mensagem;
  alertaToast.style.background = tipo === 'error' ? 'rgba(220, 38, 38, 0.94)' : 'rgba(15, 23, 42, 0.95)';
  alertaToast.classList.remove('hidden');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => alertaToast.classList.add('hidden'), 3800);
}

async function entrarDashboard() {
  mostrarSecao('dashboard');
  atualizarCabecalhoUsuario();
  await carregarTarefas();
}

async function carregarTarefas() {
  try {
    const data = await listarTarefasApi();
    tarefas = Array.isArray(data) ? data : [];
    taskController.setTasks(tarefas);
  } catch (error) {
    tratarErroAutenticacao(error);
  }
}

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

function sair() {
  definirTokenArmazenado('');
  tarefas = [];
  taskController.resetForm();
  taskController.setTasks(tarefas);
  mostrarSecao('auth');
  atualizarCabecalhoUsuario();
  definirAbaAutenticacao('login');
  
  exibirToast('Logout realizado com sucesso.');
}

function inicializar() {
  authController.bindEvents();
  taskController.bindEvents();
  definirAbaAutenticacao('login');
  atualizarCabecalhoUsuario();
  mostrarSecao(obterTokenArmazenado() ? 'dashboard' : 'auth');

  if (obterTokenArmazenado()) {
    entrarDashboard().catch(() => {
      definirTokenArmazenado('');
      mostrarSecao('auth');
    });
  }

  botaoLogout.addEventListener('click', sair);
}

inicializar();
