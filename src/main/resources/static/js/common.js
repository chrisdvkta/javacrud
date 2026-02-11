const $ = (id) => document.getElementById(id);
const status = (el, msg) => (el.textContent = msg ?? "");
const base = ""; // same-origin

const toastContainer = (() => {
  let el = document.querySelector(".toast-container");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast-container";
    document.body.appendChild(el);
  }
  return el;
})();

function toast(message, type = "info") {
  const t = document.createElement("div");
  t.className = `toast ${type === "error" ? "error" : ""}`;
  t.textContent = message;
  toastContainer.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transition = "opacity 200ms ease";
    setTimeout(() => t.remove(), 250);
  }, 2300);
}

async function api(path, opts = {}) {
  const res = await fetch(base + path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          if (typeof json === "string") message = json;
          else if (json.error) message = json.error;
          else if (Array.isArray(json)) message = json.join(", ");
          else message = Object.values(json).join(", ");
        } catch (_) {
          message = text;
        }
      }
    } catch (_) {}
    throw new Error(message || `Request failed (${res.status})`);
  }
  if (res.headers.get("content-type")?.includes("application/json")) {
    return res.json();
  }
  return null;
}

function escapeHtml(str) {
  return str.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&", "<": "<", ">": ">", '"': '"' })[c],
  );
}

// Modal functionality
function openModal(modalId) {
  const modal = $(`${modalId}-modal`);
  if (modal) {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";

    // Focus first input in modal
    const firstInput = modal.querySelector("input, textarea, button");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }

    // Add escape key handler
    document.addEventListener("keydown", handleEscapeKey);
  }
}

function closeModal(modalId) {
  const modal = $(`${modalId}-modal`);
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";

    // Remove escape key handler
    document.removeEventListener("keydown", handleEscapeKey);
  }
}

function handleEscapeKey(e) {
  if (e.key === "Escape") {
    // Close the topmost modal
    const modals = document.querySelectorAll('.modal[style*="display: block"]');
    if (modals.length > 0) {
      const modalId = modals[0].id.replace("-modal", "");
      closeModal(modalId);
    }
  }
}

// Close modal when clicking outside
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    const modalId = e.target.id.replace("-modal", "");
    closeModal(modalId);
  }
});

// Loading state management
function setLoading(element, isLoading) {
  if (isLoading) {
    element.classList.add("loading");
    element.disabled = true;
  } else {
    element.classList.remove("loading");
    element.disabled = false;
  }
}

// Enhanced status function with types
function setStatus(element, message, type = "info") {
  element.className = `status ${type}`;
  element.textContent = message;
}

// Form validation helper
function validateForm(form) {
  const inputs = form.querySelectorAll("input[required], textarea[required]");
  let isValid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add("error");
    } else {
      input.classList.remove("error");
    }
  });

  return isValid;
}

// Auto-resize textarea
function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

// Add event listeners for auto-resize
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("textarea").forEach((textarea) => {
    textarea.addEventListener("input", () => autoResizeTextarea(textarea));
    autoResizeTextarea(textarea);
  });
});
