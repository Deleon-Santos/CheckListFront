function createToastController(toastElement) {
  let timerId = null;

  return {
    show(message, type = 'info') {
      toastElement.textContent = message;
      toastElement.style.background = type === 'error' ? 'rgba(220, 38, 38, 0.94)' : 'rgba(15, 23, 42, 0.95)';
      toastElement.classList.remove('hidden');
      clearTimeout(timerId);
      timerId = setTimeout(() => toastElement.classList.add('hidden'), 3800);
    },
  };
}

export { createToastController };
