const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("send-button");
const connectionLabel = document.getElementById("connection-label");
const statusDot = document.querySelector(".status-dot");
const welcome = document.getElementById("welcome");

let history = [];
try {
  const saved = JSON.parse(localStorage.getItem("remote-mcp-chat") || "[]");
  if (Array.isArray(saved)) history = saved.slice(-24);
} catch { history = []; }

function addMessage(role, content, typing = false) {
  const row = document.createElement("div");
  row.className = role === "user" ? "user-message" : "assistant-message";
  if (role !== "user") {
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "✳";
    row.appendChild(avatar);
  }
  const body = document.createElement("div");
  body.className = "message-content";
  const author = document.createElement("div");
  author.className = "message-author";
  author.textContent = role === "user" ? "YOU" : "MCP ASSISTANT";
  const text = document.createElement("p");
  text.textContent = content;
  if (typing) text.className = "typing";
  body.append(author, text);
  row.appendChild(body);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
  return { row, text };
}

function saveHistory() {
  try { localStorage.setItem("remote-mcp-chat", JSON.stringify(history.slice(-24))); } catch {}
}

function setOnline(online) {
  statusDot.classList.toggle("online", online);
  connectionLabel.textContent = online ? "Worker online" : "Worker unavailable";
}

async function checkHealth() {
  try {
    const response = await fetch("/api/health");
    setOnline(response.ok);
  } catch { setOnline(false); }
}
checkHealth();

history.forEach(item => addMessage(item.role, item.content));
if (history.length) welcome.hidden = true;

async function sendMessage(value) {
  const message = value.trim();
  if (!message || sendButton.disabled) return;
  welcome.hidden = true;
  addMessage("user", message);
  const previousHistory = history.slice(-12);
  history.push({ role: "user", content: message });
  saveHistory();
  input.value = "";
  input.style.height = "auto";
  sendButton.disabled = true;
  const pending = addMessage("assistant", "Thinking…", true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: previousHistory })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The request failed.");
    pending.text.textContent = data.reply;
    pending.text.className = "";
    history.push({ role: "assistant", content: data.reply });
    saveHistory();
    setOnline(true);
  } catch (error) {
    pending.text.textContent = error.message || "Something went wrong. Please try again.";
    pending.text.className = "";
    setOnline(false);
  } finally {
    sendButton.disabled = false;
    input.focus();
    messages.scrollTop = messages.scrollHeight;
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 150) + "px";
});

input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt || ""));
});
