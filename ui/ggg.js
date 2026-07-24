
  function setpriorityFilter(value) {
    priorityFilter = value;
    render();
  }

  function getTaskPriorityValue(task) {
    const candidates = [
      task?.prioridade,
      task?.priority,
      task?.prioridade_nome,
      task?.priorityName,
      task?.priorityLabel,
    ];

    for (const candidate of candidates) {
      const normalized = normalizePriority(candidate);
      if (normalized) return normalized;
    }

    return 'Média';
  }

  function normalizePriority(priority) {
  if (priority === null || priority === undefined || priority === '') return '';

  const value = String(priority).trim().toLowerCase();

  const variants = [
    value,
    value.normalize('NFD').replace(/[^\w\s]/g, ''),
    value.replace(/_/g, ' '),
    value.replace(/-/g, ' ')
  ];

  const baixaValues = ['baixa', 'low', 'l'];
  const mediaValues = ['media', 'média', 'medium', 'm'];
  const altaValues = ['alta', 'high', 'h'];

  for (const variant of variants) {
    if (baixaValues.includes(variant)) return 'Baixa';
    if (mediaValues.includes(variant)) return 'Média';
    if (altaValues.includes(variant)) return 'Alta';
  }

  return '';
}


