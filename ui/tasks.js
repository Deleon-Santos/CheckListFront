import { atualizarTarefaApi, criarTarefaApi, excluirTarefaApi, listarTarefasApi } from '../api.js';
import { createToastController } from './utils.js';

function createTaskController({
  taskForm,
  taskMessage,
  taskList,
  resetTaskButton,
  tabOpen,
  tabAttended,
  tabCompleted,
  tabDeleted,
  summaryActive,
  summaryAttended,
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

  function logTaskPayload(label, payload) {
    console.groupCollapsed(`[${label}]`);
    console.log(payload);
    console.groupEnd();
  }

  function getTaskMetadataText(task) {
    const dataHoraValue = task.data_hora || task.data_hora_criacao || task.created_at || task.createdAt || task.data_criacao || task.dataCadastro || task.created_date || task.created_on || task.created || null;
    const linhaId = task.id != null ? `ID: ${task.id}` : '';
    const linhaData = dataHoraValue ? `Data/Hora: ${formatTaskDateTime(dataHoraValue)}` : '';

    if (linhaId && linhaData) return ` ${linhaId} • ${linhaData}`;
    if (linhaId) return linhaId;
    if (linhaData) return linhaData;
    return '';
  }

  function setTasks(nextTasks) {
    tasks = Array.isArray(nextTasks) ? nextTasks : [];
    render();
  }

  async function refreshTasks() {
    try {
      const refreshedTasks = await listarTarefasApi();
      logTaskPayload('Lista de tarefas atualizada', refreshedTasks);
      setTasks(refreshedTasks);
      return refreshedTasks;
    } catch (error) {
      onAuthError(error);
      throw error;
    }
  }

  function getTasks() {
    return tasks;
  }

  function getTaskStatusValue(task) {
    const candidates = [
      task?.status,
      task?.estado,
      task?.state,
      task?.status_name,
      task?.status_label,
      task?.statusValue,
      task?.status_id,
      task?.statusId,
      task?.codigo_status,
      task?.codigoStatus,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeStatus(candidate);
      if (normalized) return normalized;
    }

    return 'ativo';
  }

  function normalizeStatus(status) {
    if (status === null || status === undefined || status === '') return '';

    const value = String(status).trim().toLowerCase();
    const variants = [
      value,
      value.normalize('NFD').replace(/[^\w\s]/g, '').replace(/\s+/g, ' '),
      value.replace(/_/g, ' '),
      value.replace(/-/g, ' '),
    ];

    const activeValues = ['ativo', 'aberta', 'aberto', 'abertas', 'pendente', 'pendentes', 'em andamento', 'em andamento', 'aguardando', 'a fazer', 'todo', 'to do', 'backlog', 'new', 'open', 'pending', 'in progress', 'in progress', 'em aberto'];
    const attendedValues = ['atendido', 'atendida', 'atendidas', 'em atendimento', 'em analise', 'em análise', 'processing', 'review', 'in review', 'awaiting'];
    const completedValues = ['concluido', 'concluida', 'concluído', 'concluída', 'finalizado', 'finalizada', 'done', 'finished', 'complete', 'completed', 'pronto', 'pronta', 'resolved', 'closed'];
    const deletedValues = ['excluido', 'excluída', 'excluído', 'deletado', 'deletada', 'deleted', 'trash', 'lixeira', 'removido', 'removida'];

    for (const variant of variants) {
      if (activeValues.includes(variant)) return 'ativo';
      if (attendedValues.includes(variant)) return 'atendido';
      if (completedValues.includes(variant)) return 'concluído';
      if (deletedValues.includes(variant)) return 'excluído';
    }

    if (['0', '1', '2', '3'].includes(value)) {
      const statusByCode = { '0': 'ativo', '1': 'atendido', '2': 'concluído', '3': 'excluído' };
      return statusByCode[value];
    }

    return '';
  }

  function getStatusLabel(status) {
    if (status === 'excluído') return 'Excluída';
    if (status === 'concluído') return 'Concluída';
    if (status === 'atendido') return 'Atendida';
    return 'Aberta';
  }

  function setViewMode(mode) {
    viewMode = mode;
    tabOpen.classList.toggle('active', mode === 'active');
    tabAttended.classList.toggle('active', mode === 'attended');
    tabCompleted.classList.toggle('active', mode === 'completed');
    tabDeleted.classList.toggle('active', mode === 'deleted');
    render();
  }

  function render() {
    taskList.innerHTML = '';
    const filteredTasks = tasks.filter((task) => {
      const status = getTaskStatusValue(task);
      return viewMode === 'active'
        ? status === 'ativo'
        : viewMode === 'attended'
        ? status === 'atendido'
        : viewMode === 'completed'
        ? status === 'concluído'
        : status === 'excluído';
    });

    summaryActive.textContent = tasks.filter((task) => getTaskStatusValue(task) === 'ativo').length;
    summaryAttended.textContent = tasks.filter((task) => getTaskStatusValue(task) === 'atendido').length;
    summaryCompleted.textContent = tasks.filter((task) => getTaskStatusValue(task) === 'concluído').length;
    summaryDeleted.textContent = tasks.filter((task) => getTaskStatusValue(task) === 'excluído').length;

    if (!filteredTasks.length) {
      const emptyState = document.createElement('div');
      emptyState.className = 'task-card';
      const message = viewMode === 'active'
        ? 'ativa'
        : viewMode === 'attended'
        ? 'atendida'
        : viewMode === 'completed'
        ? 'concluída'
        : 'excluída';
      emptyState.innerHTML = `<p class="task-description">Nenhuma tarefa ${message} no momento.</p>`;
      taskList.appendChild(emptyState);
      return;
    }

    filteredTasks.forEach((task) => taskList.appendChild(createTaskCard(task)));
  }

  function createTaskCard(task) {
    const normalizedStatus = getTaskStatusValue(task);
    const isCompleted = normalizedStatus === 'concluído';
    const isDeleted = normalizedStatus === 'excluído';
    const isAttended = normalizedStatus === 'atendido';
    const isActive = normalizedStatus === 'ativo';

    const card = document.createElement('article');
    card.className = `task-card ${isDeleted ? 'deleted' : isCompleted ? 'completed' : isAttended ? 'attended' : 'active'}`;

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
    statusTag.className = `tag ${
      normalizedStatus === 'excluído'
        ? 'status-deleted'
        : normalizedStatus === 'concluído'
        ? 'status-completed'
        : normalizedStatus === 'atendido'
        ? 'status-attended'
        : 'status-active'
    }`;
    statusTag.textContent = getStatusLabel(normalizedStatus);
    labels.appendChild(statusTag);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const toggleButton = document.createElement('button');
    toggleButton.className = `action-button ${normalizedStatus === 'ativo' ? 'success' : ''} ${isCompleted ? 'complete' : ''}`;
    toggleButton.type = 'button';
    if (normalizedStatus === 'ativo') {
      toggleButton.innerHTML = '<span class="action-icon" aria-hidden="true">✓</span>';
      toggleButton.setAttribute('aria-label', 'Marcar como atendida');
    } else if (normalizedStatus === 'atendido') {
      toggleButton.innerHTML = '<span class="action-icon" aria-hidden="true">✓</span>';
      toggleButton.setAttribute('aria-label', 'Marcar como concluída');
    } else if (normalizedStatus === 'concluído') {
      toggleButton.innerHTML = '<span class="action-icon" aria-hidden="true">↺</span>';
      toggleButton.setAttribute('aria-label', 'Reabrir tarefa');
    } else {
      toggleButton.innerHTML = '<span class="action-icon" aria-hidden="true">♻</span>';
      toggleButton.setAttribute('aria-label', 'Restaurar tarefa');
    }
    toggleButton.addEventListener('click', () => toggleTask(task));
    actions.appendChild(toggleButton);

    const editButton = document.createElement('button');
    editButton.className = 'action-button';
    editButton.type = 'button';
    editButton.innerHTML = '<span aria-hidden="true">✏️</span>';
    editButton.setAttribute('aria-label', 'Editar tarefa');
    editButton.disabled = normalizedStatus === 'excluído';
    if (normalizedStatus !== 'excluído') {
      editButton.addEventListener('click', () => fillForm(task));
    }
    actions.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'action-button danger';
    deleteButton.type = 'button';
    deleteButton.innerHTML = '<span aria-hidden="true">🗑️</span>';
    deleteButton.setAttribute('aria-label', normalizedStatus === 'excluído' ? 'Excluir permanentemente' : 'Mover para lixeira');
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
      status: normalizeStatus(editingTask?.status) || 'ativo',
      user: getCurrentUser().email || getCurrentUser().nome || null,
    };

    logTaskPayload('Envio de tarefa', payload);

    if (!payload.titulo) {
      taskMessage.textContent = 'O título da tarefa é obrigatório.';
      return;
    }

    try {
      let response;
      if (editingTask) {
        response = await atualizarTarefaApi(editingTask.id, payload);
      } else {
        response = await criarTarefaApi(payload);
      }

      logTaskPayload('Resposta do backend', response);

      await refreshTasks();
      resetForm();
      toast.show(editingTask ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.');
    } catch (error) {
      onAuthError(error);
      taskMessage.textContent = error.message;
    }
  }

  async function toggleTask(task) {
    const currentStatus = getTaskStatusValue(task);
    let nextStatus = 'ativo';
    let toastMessage = 'Tarefa atualizada com sucesso.';

    if (currentStatus === 'ativo') {
      nextStatus = 'atendido';
      toastMessage = 'Tarefa marcada como atendida.';
    } else if (currentStatus === 'atendido') {
      nextStatus = 'concluído';
      toastMessage = 'Tarefa marcada como concluída.';
    } else if (currentStatus === 'concluído' || currentStatus === 'excluído') {
      nextStatus = 'ativo';
      toastMessage = currentStatus === 'concluído' ? 'Tarefa reaberta.' : 'Tarefa restaurada.';
    }

    try {
      const payload = {
        titulo: task.titulo || task.title,
        descricao: task.descricao || task.description || '',
        status: nextStatus,
      };

      logTaskPayload('Atualização de status', payload);
      const updatedTask = await atualizarTarefaApi(task.id, payload);
      logTaskPayload('Resposta de atualização', updatedTask);
      await refreshTasks();
      toast.show(toastMessage);
    } catch (error) {
      onAuthError(error);
    }
  }

  async function removeTask(task) {
    const status = getTaskStatusValue(task);
    const isDeleted = status === 'excluído';
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
        toast.show('Tarefa excluída permanentemente.');
      } else {
        const updatedTask = await atualizarTarefaApi(task.id, {
          titulo: task.titulo || task.title,
          descricao: task.descricao || task.description || '',
          status: 'excluído',
        });
        logTaskPayload('Resposta de remoção', updatedTask);
        toast.show('Tarefa movida para a lixeira.');
      }
      await refreshTasks();
    } catch (error) {
      onAuthError(error);
    }
  }

  function bindEvents() {
    taskForm.addEventListener('submit', submitForm);
    resetTaskButton.addEventListener('click', resetForm);
    tabOpen.addEventListener('click', () => setViewMode('active'));
    tabAttended.addEventListener('click', () => setViewMode('attended'));
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
