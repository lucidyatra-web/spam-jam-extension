/* ==============================
   Spam Jam Popup Logic
   Polished, animated, modern
================================*/

const KEY = "spamjam-trusted-sites-v1";
const PREFS_KEY = "spamjam-settings-v1";

/* ---------- ELEMENTS ---------- */
const addBtn = document.getElementById("add-btn");
const input = document.getElementById("trusted-site-input");
const trustedListEl = document.getElementById("trusted-list");
const emptyNote = document.getElementById("empty-note");
const countEl = document.getElementById("trusted-count");

const settingsBtn = document.getElementById("settings-btn");
const mainView = document.getElementById("main-view");
const settingsView = document.getElementById("settings-view");
const backBtn = document.getElementById("back-btn");
const headerSub = document.getElementById("header-sub");

const toggleWarning = document.getElementById("toggle-warning");
const toggleChat = document.getElementById("toggle-chat");

/* ---------- STATE ---------- */
let trustedSites = loadSites();
let prefs = loadPrefs();

/* ---------- INIT ---------- */
renderTrustedSites();
applyPrefsUI();

/* ---------- EVENTS ---------- */
addBtn.addEventListener("click", onAdd);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") onAdd(); });

settingsBtn.addEventListener("click", () => switchView(mainView, settingsView, "Settings"));
backBtn.addEventListener("click", () => switchView(settingsView, mainView, "Trusted Sites"));

toggleWarning.addEventListener("change", savePrefs);
toggleChat.addEventListener("change", savePrefs);

/* ---------- FUNCTIONS ---------- */

// Add new trusted site
function onAdd() {
  const raw = input.value.trim();
  if (!raw) return flashInput("Enter a site");
  const domain = normalizeDomain(raw);
  if (!domain) return flashInput("Invalid URL");
  if (trustedSites.includes(domain)) return flashInput("Already added");

  // Add to top
  trustedSites.unshift(domain);
  saveSites();
  renderTrustedSites();
  input.value = "";
  showSavedToast();
}

// Render trusted sites
function renderTrustedSites() {
  trustedListEl.innerHTML = "";
  if (!trustedSites.length) {
    emptyNote.style.display = "block";
  } else {
    emptyNote.style.display = "none";
  }

  trustedSites.forEach((domain, idx) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    left.className = "item-left";
    const icon = document.createElement("div");
    icon.className = "domain-favicon";
    icon.textContent = domain[0].toUpperCase();
    const text = document.createElement("span");
    text.textContent = domain;
    left.append(icon, text);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    // Open button
    const openBtn = document.createElement("button");
    openBtn.className = "visit-btn";
    openBtn.textContent = "Open";
    openBtn.onclick = () => window.open(`https://${domain}`, "_blank");

    // Remove button
    const delBtn = document.createElement("button");
    delBtn.className = "remove-btn";
    delBtn.textContent = "✕";
    delBtn.onclick = () => {
      trustedSites.splice(idx, 1);
      saveSites();
      renderTrustedSites();
    };

    actions.append(openBtn, delBtn);
    li.append(left, actions);
    trustedListEl.append(li);
  });

  countEl.textContent = trustedSites.length;
}

// Normalize user input to domain
function normalizeDomain(input) {
  try {
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

// Flash placeholder text (temporary message)
function flashInput(msg) {
  const orig = input.placeholder;
  input.placeholder = msg;
  input.value = "";
  input.classList.add("shake");
  setTimeout(() => {
    input.placeholder = orig;
    input.classList.remove("shake");
  }, 1000);
}

// Toast-like success feedback
function showSavedToast() {
  addBtn.textContent = "Saved ✓";
  addBtn.disabled = true;
  setTimeout(() => {
    addBtn.textContent = "Add";
    addBtn.disabled = false;
  }, 900);
}

// LocalStorage helpers
function saveSites() {
  localStorage.setItem(KEY, JSON.stringify(trustedSites));
}
function loadSites() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/* ---------- SETTINGS ---------- */
function savePrefs() {
  prefs.warningMode = toggleWarning.checked;
  prefs.chatAnalysis = toggleChat.checked;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || { warningMode: true, chatAnalysis: false };
  } catch {
    return { warningMode: true, chatAnalysis: false };
  }
}

function applyPrefsUI() {
  toggleWarning.checked = prefs.warningMode;
  toggleChat.checked = prefs.chatAnalysis;
}

/* ---------- VIEW TRANSITIONS ---------- */
function switchView(from, to, headerText) {
  headerSub.textContent = headerText;

  // prepare new view
  to.classList.add("entering");
  to.classList.remove("hidden");

  // fade out old view
  from.classList.add("hidden");

  // trigger animation
  requestAnimationFrame(() => {
    to.classList.add("active");
    to.offsetWidth; // force reflow
    to.classList.add("active");
  });

  // cleanup
  setTimeout(() => {
    to.classList.remove("entering");
    from.classList.remove("active");
  }, 350);
}
