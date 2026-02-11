let editingId = null;

async function me() {
  try {
    const user = await api("/api/auth/me");
    if (user) {
      $("user-info").textContent = `Logged in as ${user.username}`;
      await loadTodos();
    }
  } catch (_) {
    $("user-info").textContent = "Not logged in";
    status($("todo-status"), "Please login first");
    toast("Please login first", "error");
  }
}

async function createTodo() {
  status($("todo-status"), "Creating...");
  setLoading($("create-btn"), true);
  try {
    const body = JSON.stringify({
      title: $("todo-title").value,
      description: $("todo-desc").value,
      completed: $("todo-completed").checked,
    });
    await api("/api/todos", { method: "POST", body });
    status($("todo-status"), "Created");
    toast("Todo created");
    resetForm();
    await loadTodos();
  } catch (err) {
    status($("todo-status"), `Error: ${err.message}`);
    toast(err.message, "error");
  } finally {
    setLoading($("create-btn"), false);
  }
}

async function saveTodo() {
  if (!editingId) {
    status($("todo-status"), "Select a todo first");
    toast("Select a todo first", "error");
    return;
  }
  status($("todo-status"), "Saving...");
  setLoading($("save-btn"), true);
  try {
    const body = JSON.stringify({
      title: $("todo-title").value,
      description: $("todo-desc").value,
      completed: $("todo-completed").checked,
    });
    await api(`/api/todos/${editingId}`, { method: "PUT", body });
    status($("todo-status"), "Updated");
    toast("Todo updated");
    resetForm();
    await loadTodos();
  } catch (err) {
    status($("todo-status"), `Error: ${err.message}`);
    toast(err.message, "error");
  } finally {
    setLoading($("save-btn"), false);
  }
}

async function deleteTodo(id) {
  if (!confirm("Delete this todo?")) return;
  try {
    await api(`/api/todos/${id}`, { method: "DELETE" });
    toast("Todo deleted");
    await loadTodos();
  } catch (err) {
    toast(err.message, "error");
  }
}

async function toggleComplete(todo) {
  try {
    await api(`/api/todos/${todo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: todo.title,
        description: todo.description,
        completed: !todo.completed,
      }),
    });
    toast(!todo.completed ? "Marked done" : "Marked open");
    await loadTodos();
  } catch (err) {
    toast(err.message, "error");
  }
}

async function loadTodos() {
  setLoading($("refresh-btn"), true);
  try {
    const todos = await api("/api/todos");
    renderTodos(todos);
    status($("todo-status"), todos.length ? "" : "No todos yet");
  } catch (err) {
    renderTodos([]);
    status($("todo-status"), "Error loading todos");
    toast("Please login first", "error");
  } finally {
    setLoading($("refresh-btn"), false);
  }
}

function renderTodos(todos) {
  const list = $("todo-list");
  list.innerHTML = "";

  if (!todos || todos.length === 0) {
    list.innerHTML =
      '<div class="muted" style="text-align: center; padding: 20px;">No todos yet. Create your first todo!</div>';
    return;
  }

  todos.forEach((t) => {
    const div = document.createElement("div");
    div.className = "todo";
    div.innerHTML = `
      <div class="row" style="justify-content: space-between;">
        <div class="title">${escapeHtml(t.title)}</div>
        <span class="badge">${t.completed ? "Done" : "Open"}</span>
      </div>
      <div class="desc">${escapeHtml(t.description || "")}</div>
      <div class="muted" style="font-size:12px;">Created: ${new Date(t.createdAt).toLocaleString()}</div>
      <div class="actions">
        <button class="small" data-id="${t.id}" data-action="edit">Edit</button>
        <button class="small" data-id="${t.id}" data-action="toggle">${t.completed ? "Mark open" : "Mark done"}</button>
        <button class="small danger" data-id="${t.id}" data-action="delete">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });

  list.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.getAttribute("data-id");
      const action = e.target.getAttribute("data-action");
      const todo = todos.find((t) => t.id == id);
      if (action === "edit") fillForm(todo);
      if (action === "toggle") toggleComplete(todo);
      if (action === "delete") deleteTodo(id);
    });
  });
}

function fillForm(todo) {
  editingId = todo.id;
  $("todo-title").value = todo.title;
  $("todo-desc").value = todo.description || "";
  $("todo-completed").checked = todo.completed;
  $("edit-hint").textContent = `Editing #${todo.id}`;
}

function resetForm() {
  editingId = null;
  $("todo-form").reset();
  $("edit-hint").textContent = "No item selected";
}

window.addEventListener("DOMContentLoaded", () => {
  // Todo modal elements might not exist if we're on a different page
  if ($("create-btn")) {
    $("create-btn").onclick = createTodo;
  }
  if ($("save-btn")) {
    $("save-btn").onclick = saveTodo;
  }
  if ($("refresh-btn")) {
    $("refresh-btn").onclick = loadTodos;
  }
});
