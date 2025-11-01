// scripts/content.js
console.log("[content] Loaded on:", location.href);

(async () => {
  console.log("[content] Triggering site analysis...");
  showFloatingStatus("Analyzing"); // Show spinner badge
  await window.analyzeSite?.();
  removeFloatingStatus(); // Hide spinner after analysis
})();

/* ===== Floating status badge ===== */
function showFloatingStatus(text) {
  if (document.querySelector("#fillit-status")) return;

  const badge = document.createElement("div");
  badge.id = "fillit-status";
  badge.innerHTML = `
    <div class="fillit-spinner"></div>
    <span>${text}</span>
  `;
  document.body.appendChild(badge);

  requestAnimationFrame(() => badge.classList.add("show"));
}

function removeFloatingStatus() {
  const badge = document.querySelector("#fillit-status");
  if (badge) {
    badge.classList.remove("show");
    setTimeout(() => badge.remove(), 300);
  }
}

/* ===== Suspicious site overlay ===== */
window.showOverlay = function showOverlay(reason) {
  console.log("[content] Showing suspicious overlay...");

  if (document.querySelector("#fillit-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "fillit-overlay";
  overlay.innerHTML = `
    <div id="fillit-popup">
      <h2>⚠️ Suspicious Site Detected</h2>
      <p>${reason}</p>
      <button id="close-overlay">Got it</button>
    </div>
  `;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add("show"));
  overlay.querySelector("#close-overlay").onclick = () => {
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 300);
  };
};

/* ===== Receive analysis result from background/siteAnalyzer ===== */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "siteAnalysisResult") {
    console.log("[content] Received site analysis result:", msg.data);

    if (msg.data?.is_suspicious) {
      window.showOverlay(msg.data.reason || "This site seems suspicious.");
    } else {
      console.log("[content] Site appears safe ✅");
      // Optionally, you can show a subtle success animation here
    }
  }
});
