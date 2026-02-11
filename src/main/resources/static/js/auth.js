let currentUser = null;

function renderUser(user) {
  currentUser = user;
  if (user) {
    status($("auth-status"), `Logged in as ${user.username} (id ${user.id})`);
    $("user-info").textContent = `Logged in as ${user.username}`;
    toast(`Logged in as ${user.username}`);
  } else {
    status($("auth-status"), "Not logged in");
    $("user-info").textContent = "Not logged in";
  }
}

async function register() {
  status($("auth-status"), "Registering...");
  setLoading($("register-btn"), true);
  try {
    const body = JSON.stringify({
      username: $("username").value,
      password: $("password").value,
    });
    const user = await api("/api/auth/register", { method: "POST", body });
    renderUser(user);
    toast("Registered successfully");

    // Close modal and redirect to todos
    setTimeout(() => {
      closeModal("auth");
      openModal("todos");
    }, 1500);
  } catch (err) {
    status($("auth-status"), `Error: ${err.message}`);
    toast(err.message, "error");
  } finally {
    setLoading($("register-btn"), false);
  }
}

async function login() {
  status($("auth-status"), "Logging in...");
  setLoading($("login-btn"), true);
  try {
    const body = JSON.stringify({
      username: $("username").value,
      password: $("password").value,
    });
    const user = await api("/api/auth/login", { method: "POST", body });
    renderUser(user);
    toast("Login successful");

    // Close modal and redirect to todos
    setTimeout(() => {
      closeModal("auth");
      openModal("todos");
    }, 1500);
  } catch (err) {
    status($("auth-status"), `Error: ${err.message}`);
    toast(err.message, "error");
  } finally {
    setLoading($("login-btn"), false);
  }
}

async function me() {
  status($("auth-status"), "Checking session...");
  setLoading($("me-btn"), true);
  try {
    const user = await api("/api/auth/me");
    renderUser(user);
  } catch (err) {
    renderUser(null);
    toast("Not logged in", "error");
  } finally {
    setLoading($("me-btn"), false);
  }
}

async function logout() {
  setLoading($("logout-btn"), true);
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch (_) {}
  renderUser(null);
  toast("Logged out");
  setLoading($("logout-btn"), false);

  // Clear form
  $("auth-form").reset();
  $("auth-status").textContent = "";
}

window.addEventListener("DOMContentLoaded", () => {
  // Auth modal elements might not exist if we're on a different page
  if ($("register-btn")) {
    $("register-btn").onclick = register;
  }
  if ($("login-btn")) {
    $("login-btn").onclick = login;
  }
  if ($("me-btn")) {
    $("me-btn").onclick = me;
  }
  if ($("logout-btn")) {
    $("logout-btn").onclick = logout;
  }

  // Check session on load
  me();
});
