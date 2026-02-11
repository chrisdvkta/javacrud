// Single-page front-end for auth + todos
const $ = (id) => document.getElementById(id);
const statusEl = (id, msg) => ($(id).textContent = msg ?? "");
const base = ""; // same-origin

// Toasts
(function initToast() {
  if (!document.querySelector('.toast-container')) {
    const c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
})();
function toast(message, type = 'info') {
  const c = document.querySelector('.toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type === 'error' ? 'error' : ''}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity 200ms ease';
    setTimeout(() => t.remove(), 220);
  }, 2300);
}

async function api(path, opts = {}) {
  const res = await fetch(base + path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'include',
    ...opts,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          if (typeof json === 'string') message = json;
          else if (json.error) message = json.error;
          else if (Array.isArray(json)) message = json.join(', ');
          else message = Object.values(json).join(', ');
        } catch (_) {
          message = text;
        }
      }
    } catch (_) {}
    throw new Error(message || `Request failed (${res.status})`);
  }
  if (res.headers.get('content-type')?.includes('application/json')) return res.json();
  return null;
}

// Auth flows
async function register() {
  statusEl('auth-status', 'Registering...');
  try {
    const body = JSON.stringify({ username: $('#username').value, password: $('#password').value });
    const user = await api('/api/auth/register', { method: 'POST', body });
    renderUser(user);
    toast('Registered successfully');
    statusEl('auth-status', `Registered as ${user.username}`);
  } catch (err) {
    toast(err.message, 'error');
    statusEl('auth-status', `Error: ${err.message}`);
  }
}

async function login() {
  statusEl('auth-status', 'Logging in...');
  try {
    const body = JSON.stringify({ username: $('#username').value, password: $('#password').value });
    const user = await api('/api/auth/login', { method: 'POST', body });
    renderUser(user);
    toast('Login successful');
    statusEl('auth-status', `Logged in as ${user.username}`);
    await loadTodos();
  } catch (err) {
    toast(err.message, 'error');
    statusEl('auth-status', `Error: ${err.message}`);
  }
}

async function logout() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch (_) {}
  renderUser(null);
  toast('Logged out');
  statusEl('auth-status', 'Logged out');
  $('#todo-list').innerHTML = '';
}

async function me() {
  statusEl('auth-status', 'Checking session...');
  try {
    const user = await api('/api/auth/me');
    renderUser(user);
    statusEl('auth-status', `Logged in as ${user.username}`);
    await loadTodos();
  } catch (_) {
    renderUser(null);
    statusEl('auth-status', 'Not logged in');
  }
}

function renderUser(user) {
  if (user) $('#user-info').textContent = `Logged in as ${user.username}`;
  else $('#user-info').textContent = 'Not logged in';
}

// Todo flows
let editingId = null;

async function createTodo() {
  statusEl('todo-status', 'Creating...');
  toggleTodoButtons(true);
  try {
    const body = JSON.stringify({
      title: $('#todo-title').value,
      description: $('#todo-desc').value,
      completed: $('#todo-completed').checked,
    });
    await api('/api/todos', { method: 'POST', body });
    toast('Todo created');
    statusEl('todo-status', 'Created');
    resetForm();
    await loadTodos();
  } catch (err) {
    toast(err.message, 'error');
    statusEl('todo-status', `Error: ${err.message}`);
  } finally {
    toggleTodoButtons(false);
  }
}

async function saveTodo() {
  if (!editingId) {
    toast('Select a todo first', 'error');
    statusEl('todo-status', 'Select a todo first');
    return;
  }
  statusEl('todo-status', 'Saving...');
  toggleTodoButtons(true);
  try {
    const body = JSON.stringify({
      title: $('#todo-title').value,
      description: $('#todo-desc').value,
      completed: $('#todo-completed').checked,
    });
    await api(`/api/todos/${editingId}`, { method: 'PUT', body });
    toast('Todo updated');
    statusEl('todo-status', 'Updated');
    resetForm();
    await loadTodos();
  } catch (err) {
    toast(err.message, 'error');
    statusEl('todo-status', `Error: ${err.message}`);
  } finally {
    toggleTodoButtons(false);
  }
}

async function deleteTodo(id) {
  if (!confirm('Delete this todo?')) return;
  try {
    await api(`/api/todos/${id}`, { method: 'DELETE' });
    toast('Todo deleted');
    await loadTodos();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function toggleComplete(todo) {
  try {
    await api(`/api/todos/${todo.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: todo.title,
        description: todo.description,
        completed: !todo.completed,
      }),
    });
    toast(!todo.completed ? 'Marked done' : 'Marked open');
    await loadTodos();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function loadTodos() {
  statusEl('todo-status', 'Loading...');
  try {
    const todos = await api('/api/todos');
    renderTodos(todos);
    statusEl('todo-status', todos.length ? '' : 'No todos yet');
  } catch (err) {
    renderTodos([]);
    statusEl('todo-status', 'Not logged in');
  }
}

function renderTodos(todos) {
  const list = $('#todo-list');
  list.innerHTML = '';
  todos.forEach((t) => {
    const div = document.createElement('div');
    div.className = 'todo';
    div.innerHTML = `
      <div class="row" style="justify-content: space-between;">
        <div class="title">${escapeHtml(t.title)}</div>
        <span class="badge">${t.completed ? 'Done' : 'Open'}</span>
      </div>
      <div class="desc">${escapeHtml(t.description || '')}</div>
      <div class="muted" style="font-size:12px;">Created: ${new Date(t.createdAt).toLocaleString()}</div>
      <div class="actions">
        <button class="small" data-id="${t.id}" data-action="edit">Edit</button>
        <button class="small" data-id="${t.id}" data-action="toggle">${t.completed ? 'Mark open' : 'Mark done'}</button>
        <button class="small danger" data-id="${t.id}" data-action="delete">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const action = e.target.getAttribute('data-action');
      const todo = todos.find((t) => t.id == id);
      if (action === 'edit') fillForm(todo);
      if (action === 'toggle') toggleComplete(todo);
      if (action === 'delete') deleteTodo(id);
    });
  });
}

function fillForm(todo) {
  editingId = todo.id;
  $('#todo-title').value = todo.title;
  $('#todo-desc').value = todo.description || '';
  $('#todo-completed').checked = todo.completed;
  $('#edit-hint').textContent = `Editing #${todo.id}`;
}

function resetForm() {
  editingId = null;
  $('#todo-form').reset();
  $('#edit-hint').textContent = 'No item selected';
}

function toggleTodoButtons(disabled) {
  $('#create-btn').disabled = disabled;
  $('#save-btn').disabled = disabled;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

window.addEventListener('DOMContentLoaded', () => {
  $('#register-btn').onclick = register;
  $('#login-btn').onclick = login;
  $('#logout-btn').onclick = logout;
  $('#me-btn').onclick = me;
  $('#create-btn').onclick = createTodo;
  $('#save-btn').onclick = saveTodo;
  $('#refresh-btn').onclick = loadTodos;
  $('#username').focus();
  me();
});
