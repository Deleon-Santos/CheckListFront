import { definirTokenArmazenado, obterTokenArmazenado, listarTarefasApi } from './api.js';
import { createAuthController } from './ui/auth.js';
import { createTaskController } from './ui/tasks.js';

const secaoAutenticacao = document.getElementById('authSection');
const secaoDashboard = document.getElementById('dashboardSection');
const botaoLogout = document.getElementById('logoutButton');
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
  tabActive: document.getElementById('tabActive'),
  tabCompleted: document.getElementById('tabCompleted'),
  tabDeleted: document.getElementById('tabDeleted'),
  summaryActive: document.getElementById('summaryActive'),
  summaryCompleted: document.getElementById('summaryCompleted'),
  summaryDeleted: document.getElementById('summaryDeleted'),
  toastElement: alertaToast,
  getCurrentUser: () => JSON.parse(localStorage.getItem('checklistfront_user') || '{}'),
  onAuthError: tratarErroAutenticacao,
  onLogout: sair,
});

let tarefas = [];

function mostrarSecao(secao) {
  authController.showSection(secao);
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
  definirAbaAutenticacao('login');
  exibirToast('Logout realizado com sucesso.');
}

function inicializar() {
  authController.bindEvents();
  taskController.bindEvents();
  definirAbaAutenticacao('login');
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
