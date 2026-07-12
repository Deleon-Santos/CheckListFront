import { atualizarTarefaApi, criarTarefaApi, excluirTarefaApi, listarTarefasApi } from '../api.js';
import { createToastController } from './utils.js';

function createTaskController({
  taskForm,
  taskMessage,
  taskList,
  resetTaskButton,
  tabActive,
  tabCompleted,
  tabDeleted,
  summaryActive,
  summaryCompleted,
  summaryDeleted,
  toastElement,
  getCurrentUser,
  onAuthError,
  onLogout,
}) {
  const toast = createToastController(toastElement);
  let tasks = [];
  let viewMode = 'active';
  let editingTask = null;

  const fields = {
    title: document.getElementById('taskTitle'),
    description: document.getElementById('taskDescription'),
    dueDate: document.getElementById('taskDueDate'),
    priority: document.getElementById('taskPriority'),
  };

  function formatTaskDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatTaskDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getTaskMetadataText(task) {
    const dataHoraValue = task.data_hora || task.data_hora_criacao || task.created_at || task.createdAt || task.data_criacao || task.dataCadastro || task.created_date || task.created_on || task.created || null;
    const linhaId = task.id != null ? `ID: ${task.id}` : '';
    const linhaData = dataHoraValue ? `Data/Hora: ${formatTaskDateTime(dataHoraValue)}` : '';

    if (linhaId && linhaData) return `${linhaId} • ${linhaData}`;
    if (linhaId) return linhaId;
    if (linhaData) return linhaData;
    return '';
  }

  function setTasks(nextTasks) {
    tasks = Array.isArray(nextTasks) ? nextTasks : [];
    render();
  }

  function getTasks() {
    return tasks;
  }

  function setViewMode(mode) {
    viewMode = mode;
    tabActive.classList.toggle('active', mode === 'active');
    tabCompleted.classList.toggle('active', mode === 'completed');
    tabDeleted.classList.toggle('active', mode === 'deleted');
    render();
  }

  function render() {
    taskList.innerHTML = '';
    const filteredTasks = tasks.filter((task) => {
      const status = String(task.status || '').toLowerCase();
      const isCompleted = status === 'concluído' || status === 'concluido';
      const isDeleted = status === 'excluído' || status === 'excluido';
      return viewMode === 'active'
        ? status === 'ativo'
        : viewMode === 'completed'
        ? isCompleted
        : isDeleted;
    });

    summaryActive.textContent = tasks.filter((task) => String(task.status || '').toLowerCase() === 'ativo').length;
    summaryCompleted.textContent = tasks.filter((task) => {
      const status = String(task.status || '').toLowerCase();
      return status === 'concluído' || status === 'concluido';
    }).length;
    summaryDeleted.textContent = tasks.filter((task) => {
      const status = String(task.status || '').toLowerCase();
      return status === 'excluído' || status === 'excluido';
    }).length;

    if (!filteredTasks.length) {
      const emptyState = document.createElement('div');
      emptyState.className = 'task-card';
      const message = viewMode === 'active' ? 'ativa' : viewMode === 'completed' ? 'concluída' : 'excluída';
      emptyState.innerHTML = `<p class="task-description">Nenhuma tarefa ${message} no momento.</p>`;
      taskList.appendChild(emptyState);
      return;
    }

    filteredTasks.forEach((task) => taskList.appendChild(createTaskCard(task)));
  }

  function createTaskCard(task) {
    const status = String(task.status || '').toLowerCase();
    const isCompleted = status === 'concluído' || status === 'concluido';
    const isDeleted = status === 'excluído' || status === 'excluido';
    const isActive = status === 'ativo';

    const card = document.createElement('article');
    card.className = `task-card ${isDeleted ? 'deleted' : isCompleted ? 'completed' : 'active'}`;

    const title = document.createElement('h3');
    title.className = `task-title ${isCompleted ? 'completed' : ''}`;
    title.textContent = task.titulo || task.title || '';

    const description = document.createElement('p');
    description.className = 'task-description';
    description.textContent = task.descricao || task.description || 'Sem descrição adicional';

    const metadata = document.createElement('p');
    metadata.className = 'task-created-date';
    const metadataText = getTaskMetadataText(task);
    if (metadataText) {
      metadata.textContent = metadataText;
    }

    const labels = document.createElement('div');
    labels.className = 'task-labels';

    const statusTag = document.createElement('span');
    statusTag.className = `tag ${isDeleted ? 'status-deleted' : isCompleted ? 'status-completed' : 'status-active'}`;
    statusTag.textContent = task.status || (isDeleted ? 'Excluído' : isCompleted ? 'Concluído' : 'Ativo');
    labels.appendChild(statusTag);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const toggleButton = document.createElement('button');
    toggleButton.className = `action-button ${isActive ? 'success' : ''}`;
    toggleButton.type = 'button';
    toggleButton.textContent = isDeleted ? 'Restaurar tarefa' : isActive ? 'Marcar como concluída' : 'Reativar tarefa';
    toggleButton.addEventListener('click', () => toggleTask(task));
    actions.appendChild(toggleButton);

    const editButton = document.createElement('button');
    editButton.className = 'action-button';
    editButton.type = 'button';
    editButton.textContent = 'Editar';
    editButton.disabled = isDeleted;
    if (!isDeleted) {
      editButton.addEventListener('click', () => fillForm(task));
    }
    actions.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'action-button danger';
    deleteButton.type = 'button';
    deleteButton.textContent = isDeleted ? 'Excluir permanentemente' : 'Mover para lixeira';
    deleteButton.addEventListener('click', () => removeTask(task));
    actions.appendChild(deleteButton);

    card.append(title, description, metadataText ? metadata : '', labels, actions);
    return card;
  }

  function resetForm() {
    taskForm.reset();
    editingTask = null;
    taskMessage.textContent = '';
    taskForm.querySelector('button[type="submit"]').textContent = 'Salvar tarefa';
  }

  function fillForm(task) {
    editingTask = task;
    fields.title.value = task.titulo || task.title || '';
    fields.description.value = task.descricao || task.description || '';
    fields.dueDate.value = task.due_date || task.vencimento || '';
    fields.priority.value = task.prioridade || task.priority || 'Média';

    taskForm.querySelector('button[type="submit"]').textContent = 'Atualizar tarefa';
    taskMessage.textContent = '';
    fields.title.focus();
  }

  async function submitForm(event) {
    event.preventDefault();
    taskMessage.textContent = '';

    const payload = {
      titulo: fields.title.value.trim(),
      descricao: fields.description.value.trim(),
      due_date: fields.dueDate.value || null,
      prioridade: fields.priority.value || 'Média',
      status: editingTask?.status || 'ativo',
      user: getCurrentUser().email || getCurrentUser().nome || null,
    };

    if (!payload.titulo) {
      taskMessage.textContent = 'O título da tarefa é obrigatório.';
      return;
    }

    try {
      if (editingTask) {
        await atualizarTarefaApi(editingTask.id, payload);
      } else {
        await criarTarefaApi(payload);
      }

      const refreshedTasks = await listarTarefasApi();
      setTasks(refreshedTasks);
      resetForm();
      toast.show(editingTask ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.');
    } catch (error) {
      onAuthError(error);
      taskMessage.textContent = error.message;
    }
  }

  async function toggleTask(task) {
    const currentStatus = String(task.status || '').toLowerCase();
    const nextStatus = currentStatus === 'ativo' ? 'concluído' : 'ativo';

    try {
      const updatedTask = await atualizarTarefaApi(task.id, {
        titulo: task.titulo || task.title,
        descricao: task.descricao || task.description || '',
        status: nextStatus,
      });
      tasks = tasks.map((item) => (item.id === updatedTask.id ? updatedTask : item));
      const messageStatus = nextStatus.toLowerCase().includes('concl') ? 'concluída' : 'reativada';
      toast.show(`Tarefa ${messageStatus} com sucesso.`);
      render();
    } catch (error) {
      onAuthError(error);
    }
  }

  async function removeTask(task) {
    const status = String(task.status || '').toLowerCase();
    const isDeleted = status === 'excluído' || status === 'excluido';
    const taskTitle = task.titulo || task.title || '';
    const confirmed = confirm(
      isDeleted
        ? `Excluir permanentemente a tarefa "${taskTitle}"? Esta ação não pode ser desfeita.`
        : `Mover a tarefa "${taskTitle}" para a lixeira?`
    );

    if (!confirmed) return;

    try {
      if (isDeleted) {
        await excluirTarefaApi(task.id);
        tasks = tasks.filter((item) => item.id !== task.id);
        toast.show('Tarefa excluída permanentemente.');
      } else {
        const updatedTask = await atualizarTarefaApi(task.id, {
          titulo: task.titulo || task.title,
          descricao: task.descricao || task.description || '',
          status: 'excluído',
        });
        tasks = tasks.map((item) => (item.id === updatedTask.id ? updatedTask : item));
        toast.show('Tarefa movida para a lixeira.');
      }
      render();
    } catch (error) {
      onAuthError(error);
    }
  }

  function bindEvents() {
    taskForm.addEventListener('submit', submitForm);
    resetTaskButton.addEventListener('click', resetForm);
    tabActive.addEventListener('click', () => setViewMode('active'));
    tabCompleted.addEventListener('click', () => setViewMode('completed'));
    tabDeleted.addEventListener('click', () => setViewMode('deleted'));
  }

  return {
    setTasks,
    getTasks,
    resetForm,
    bindEvents,
    render,
    fillForm,
    setViewMode,
    getCurrentViewMode: () => viewMode,
  };
}

export { createTaskController };
