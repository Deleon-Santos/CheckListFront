import { definirTokenArmazenado, loginApi, cadastrarApi } from '../api.js';
import { createToastController } from './utils.js';

function createAuthController({
  authSection,
  dashboardSection,
  logoutButton,
  showLoginButton,
  showRegisterButton,
  loginForm,
  registerForm,
  loginMessage,
  registerMessage,
  toastElement,
  onEnterDashboard,
}) {
  const toast = createToastController(toastElement);

  const fields = {
    login: {
      email: document.getElementById('loginEmail'),
      senha: document.getElementById('loginPassword'),
    },
    cadastro: {
      nome: document.getElementById('registerName'),
      email: document.getElementById('registerEmail'),
      senha: document.getElementById('registerPassword'),
    },
  };

  function showSection(section) {
    const hasSession = Boolean(localStorage.getItem('checklistfront_token'));
    const shouldShowDashboard = section === 'dashboard' && hasSession;

    authSection.classList.toggle('hidden', shouldShowDashboard);
    dashboardSection.classList.toggle('hidden', !shouldShowDashboard);
    logoutButton.hidden = !shouldShowDashboard;
  }

  function setAuthTab(tab) {
    showLoginButton.classList.toggle('active', tab === 'login');
    showRegisterButton.classList.toggle('active', tab === 'register');
    loginForm.classList.toggle('hidden', tab !== 'login');
    registerForm.classList.toggle('hidden', tab !== 'register');
    loginMessage.textContent = '';
    registerMessage.textContent = '';
  }

  async function login(event) {
    event.preventDefault();
    loginMessage.textContent = '';

    const payload = {
      email: fields.login.email.value.trim(),
      senha: fields.login.senha.value,
    };

    if (!payload.email || !payload.senha) {
      loginMessage.textContent = 'Informe email e senha.';
      return;
    }

    try {
      const data = await loginApi(payload);
      definirTokenArmazenado(data.access_token);
      localStorage.setItem('checklistfront_user', JSON.stringify(data.user || { email: payload.email }));
      toast.show('Login realizado com sucesso.');
      await onEnterDashboard();
    } catch (error) {
      loginMessage.textContent = error.message;
    }
  }

  async function register(event) {
    event.preventDefault();
    registerMessage.textContent = '';

    const payload = {
      nome: fields.cadastro.nome.value.trim(),
      email: fields.cadastro.email.value.trim(),
      senha: fields.cadastro.senha.value,
    };

    if (!payload.nome || !payload.email || !payload.senha) {
      registerMessage.textContent = 'Preencha todos os campos obrigatórios.';
      return;
    }

    try {
      const data = await cadastrarApi(payload);
      definirTokenArmazenado(data.access_token);
      localStorage.setItem('checklistfront_user', JSON.stringify(data.user || {
        email: payload.email,
        nome: payload.nome,
        senha: payload.senha,
      }));
      toast.show('Conta criada com sucesso.');
      await onEnterDashboard();
    } catch (error) {
      registerMessage.textContent = error.message;
    }
  }

  function bindEvents() {
    showLoginButton.addEventListener('click', () => setAuthTab('login'));
    showRegisterButton.addEventListener('click', () => setAuthTab('register'));
    loginForm.addEventListener('submit', login);
    registerForm.addEventListener('submit', register);
  }

  return {
    showSection,
    setAuthTab,
    bindEvents,
    getFields: () => fields,
  };
}

export { createAuthController };
