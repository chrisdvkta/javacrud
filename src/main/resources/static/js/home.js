function renderUser(user) {
  if (user) {
    if ($("user-info")) {
      $("user-info").textContent = `Logged in as ${user.username}`;
    }
  } else {
    if ($("user-info")) {
      $("user-info").textContent = "Not logged in";
    }
  }
}

async function me() {
  try {
    const user = await api("/api/auth/me");
    renderUser(user);
  } catch (_) {
    renderUser(null);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  me();
});
