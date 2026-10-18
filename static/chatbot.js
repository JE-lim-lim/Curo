(() => {
  const roots = [...document.querySelectorAll('[data-chat-root]')];
  if (!roots.length) return;
  const histories = new WeakMap();
  const welcomeText = 'Hello! I can help you use Curo or explain wording in care instructions. Please avoid sharing identifying details.';

  function appendMessage(root, role, text, label) {
    const list = root.querySelector('[data-chat-messages]');
    const article = document.createElement('article');
    article.className = `curo-chat-message ${role}`;
    const heading = document.createElement('div');
    heading.className = 'curo-chat-message-label';
    heading.textContent = label || (role === 'user' ? 'You' : 'Curo');
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    article.append(heading, paragraph);
    list.appendChild(article);
    list.scrollTop = list.scrollHeight;
    return article;
  }

  function setBusy(root, busy) {
    root.dataset.busy = busy ? 'true' : 'false';
    const form = root.querySelector('[data-chat-form]');
    const input = root.querySelector('[data-chat-input]');
    const button = form && form.querySelector('button[type="submit"]');
    if (input) input.disabled = busy;
    if (button) { button.disabled = busy; button.textContent = busy ? 'Thinking…' : (root.hasAttribute('data-chat-full') ? 'Send message →' : '➤'); }
  }

  async function send(root, text) {
    const value = (text || '').trim();
    if (!value || root.dataset.busy === 'true') return;
    const history = histories.get(root) || [];
    history.push({ role: 'user', content: value });
    histories.set(root, history);
    appendMessage(root, 'user', value, 'You');
    const input = root.querySelector('[data-chat-input]');
    if (input) { input.value = ''; input.style.height = ''; }
    setBusy(root, true);
    const pending = appendMessage(root, 'assistant', 'I’m checking that for you…', 'Curo');
    pending.classList.add('is-pending');
    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ messages: history.slice(-12) })
      });
      const payload = await response.json().catch(() => ({}));
      pending.remove();
      if (!response.ok) {
        appendMessage(root, 'error', payload.error || 'Sorry, the assistant could not respond. Please try again.', 'Notice');
        // Remove the failed turn from API history so the next request still alternates user/model turns.
        history.pop();
        histories.set(root, history);
        return;
      }
      const reply = String(payload.reply || 'I could not create a response just now. Please try again.');
      history.push({ role: 'assistant', content: reply });
      histories.set(root, history);
      appendMessage(root, 'assistant', reply, 'Curo');
    } catch (_) {
      pending.remove();
      appendMessage(root, 'error', 'I couldn’t connect. Check your connection and try again.', 'Connection issue');
    } finally {
      setBusy(root, false);
      if (input) input.focus();
    }
  }

  roots.forEach(root => {
    histories.set(root, []);
    const form = root.querySelector('[data-chat-form]');
    const input = root.querySelector('[data-chat-input]');
    if (form) form.addEventListener('submit', event => {
      event.preventDefault();
      send(root, input ? input.value : '');
    });
    if (input) input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    });
    root.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => send(root, button.dataset.prompt || '')));
    const clear = root.querySelector('[data-chat-clear]');
    if (clear) clear.addEventListener('click', () => {
      histories.set(root, []);
      const list = root.querySelector('[data-chat-messages]');
      list.replaceChildren();
      appendMessage(root, 'assistant', 'New conversation started. What would you like help with?', 'Curo');
      if (input) input.focus();
    });
  });

  const launcher = document.querySelector('[data-chat-launcher]');
  if (launcher) {
    const toggle = launcher.querySelector('[data-chat-toggle]');
    const popover = launcher.querySelector('[data-chat-root]');
    const close = launcher.querySelector('[data-chat-close]');
    const setOpen = open => {
      popover.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) setTimeout(() => popover.querySelector('[data-chat-input]')?.focus(), 0);
    };
    toggle.addEventListener('click', () => setOpen(popover.hidden));
    close.addEventListener('click', () => { setOpen(false); toggle.focus(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !popover.hidden) { setOpen(false); toggle.focus(); } });
  }
})();
