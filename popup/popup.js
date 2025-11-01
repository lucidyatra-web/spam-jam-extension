/* ==============================
   Spam Jam Popup Logic
   Polished, animated, modern
================================*/

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
const toggleSmartFilters = document.getElementById("toggle-smart-filters");

/* ---------- STATE ---------- */
let trustedSites = [];
let prefs = {};

/* ---------- INIT ---------- */
(async () => {
  await loadData();
  renderTrustedSites();
  applyPrefsUI();
  checkAIStatus();
})();

/* ---------- EVENTS ---------- */
addBtn.addEventListener("click", onAdd);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") onAdd(); });

settingsBtn.addEventListener("click", () => switchView(mainView, settingsView, "Settings"));
backBtn.addEventListener("click", () => switchView(settingsView, mainView, "Trusted Sites"));

toggleWarning.addEventListener("change", savePrefs);
toggleChat.addEventListener("change", savePrefs);
toggleSmartFilters.addEventListener("change", handleSmartFilters);

/* ---------- FUNCTIONS ---------- */

// Add new trusted site
async function onAdd() {
  const raw = input.value.trim();
  if (!raw) return flashInput("Enter a site");
  const domain = normalizeDomain(raw);
  if (!domain) return flashInput("Invalid URL");
  if (trustedSites.includes(domain)) return flashInput("Already added");

  // Add to top
  trustedSites.unshift(domain);
  await saveSites();
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
    delBtn.onclick = async () => {
      trustedSites.splice(idx, 1);
      await saveSites();
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

/* ---------- STORAGE HELPERS ---------- */
async function loadData() {
  const data = await chrome.storage.local.get({
    trustedSites: [],
    mode: "warning", // "warning" or "block"
    chatAnalysis: true
  });

  trustedSites = data.trustedSites || [];
  prefs = {
    mode: data.mode || "warning",
    chatAnalysis: data.chatAnalysis !== false
  };
}

async function saveSites() {
  await chrome.storage.local.set({ trustedSites });
}

/* ---------- SETTINGS ---------- */
async function savePrefs() {
  prefs.mode = toggleWarning.checked ? "block" : "warning";
  prefs.chatAnalysis = toggleChat.checked;

  await chrome.storage.local.set({
    mode: prefs.mode,
    chatAnalysis: prefs.chatAnalysis
  });
}

function applyPrefsUI() {
  toggleWarning.checked = prefs.mode === "block";
  toggleChat.checked = prefs.chatAnalysis;
  toggleSmartFilters.checked = false; // Always off
}

/* ---------- SMART FILTERS HANDLER ---------- */
function handleSmartFilters() {
  if (toggleSmartFilters.checked) {
    // Show coming soon message and turn it back off
    alert("🚀 Smart Filters - Coming Soon!\n\nThis feature is under development and will be available in the next update.");
    toggleSmartFilters.checked = false;
  }
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

/* ---------- AI STATUS CHECK ---------- */
async function checkAIStatus() {
  try {
    // Get the active tab and check AI status
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "getAIStatus" });
      const statusEl = document.getElementById("ai-status");
      
      if (response && response.isBuiltInAvailable) {
        statusEl.textContent = "v1.0 • Built-in AI";
        statusEl.title = "Using Chrome's built-in AI (Gemini Nano)";
      } else {
        statusEl.textContent = "v1.0 • Cloud AI";
        statusEl.title = "Using cloud-based AI (Gemini API)";
      }
    }
  } catch (error) {
    console.log("[Popup] Could not check AI status:", error);
    // Default to showing version only
    document.getElementById("ai-status").textContent = "v1.0";
  }
}
