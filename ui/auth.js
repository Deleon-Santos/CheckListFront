import { definirTokenArmazenado, loginApi, cadastrarApi, obterTokenArmazenado } from '../api.js';
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

  function extractTokenFromResponse(data) {
    if (!data) return '';
    return (
      data.access_token ||
      data.token ||
      data.accessToken ||
      data.auth_token ||
      data.jwt ||
      ''
    );
  }

  function showSection(section) {
    const hasSession = Boolean(obterTokenArmazenado());
    const shouldShowDashboard = section === 'dashboard' && hasSession;

    if (!hasSession && section !== 'auth') {
      definirTokenArmazenado('');
    }

    authSection.classList.toggle('hidden', shouldShowDashboard);
    dashboardSection.classList.toggle('hidden', !shouldShowDashboard);
    dashboardSection.style.display = shouldShowDashboard ? '' : 'none';
    logoutButton.hidden = !shouldShowDashboard;
  }

  function resetRegisterForm() {
    fields.cadastro.nome.value = '';
    fields.cadastro.email.value = '';
    fields.cadastro.senha.value = '';
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
      const userData = data.user || { email: payload.email };
      const token = extractTokenFromResponse(data);
      if (token) {
        definirTokenArmazenado(token);
      } else {
        console.warn('Token não retornado no login:', data);
      }
      localStorage.setItem('checklistfront_user', JSON.stringify(userData));
      console.log('Usuário logado:', userData.nome || userData.name || userData.email);
      toast.show('Login realizado com sucesso.');
      if (token) await onEnterDashboard();
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

    try {
      console.groupCollapsed('[Envio de cadastro]');
      console.log(payload);
      console.groupEnd();

      const data = await cadastrarApi(payload);
      console.groupCollapsed('[Resposta do cadastro]');
      console.log(data);
      console.groupEnd();

      const userData = data.user || {
        email: payload.email,
        nome: payload.nome,
        senha: payload.senha,
      };

      const token = extractTokenFromResponse(data);
      localStorage.setItem('checklistfront_user', JSON.stringify(userData));
      resetRegisterForm();

      if (token) {
        definirTokenArmazenado(token);
        console.log('Usuário cadastrado e token armazenado:', userData.nome || userData.email);
        registerMessage.textContent = 'Novo usuário cadastrado com sucesso!';
        toast.show('Novo usuário cadastrado. Entrando no sistema...');
        setTimeout(async () => {
          try {
            await onEnterDashboard();
          } catch (error) {
            console.error('Erro ao entrar no sistema após cadastro:', error);
          }
        }, 700);
      } else {
        console.log('Usuário cadastrado (sem token):', userData.nome || userData.email);
        registerMessage.textContent = 'Novo usuário cadastrado com sucesso!';
        toast.show('Novo usuário cadastrado. Faça login para continuar.');
        setAuthTab('login');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      registerMessage.textContent = error.message || String(error);
      try {
        toast.show(error.message || 'Erro ao criar conta', 'error');
      } catch (e) {
        /* ignore */
      }
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
