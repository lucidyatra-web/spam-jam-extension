// scripts/content.js
console.log("[content] Loaded on:", location.href);

(async () => {
  console.log("[content] Triggering site analysis...");
  showFloatingStatus("Analyzing"); // Show spinner badge
  await window.analyzeSite?.();
  removeFloatingStatus(); // Hide spinner after analysis
})();

/* ===== Luxurious Analyzing Animation ===== */
function showFloatingStatus(text) {
  if (document.querySelector("#spamjam-analyzer")) return;

  const analyzer = document.createElement("div");
  analyzer.id = "spamjam-analyzer";
  analyzer.innerHTML = `
    <div class="analyzer-container">
      <div class="analyzer-icon">
        <div class="shield-icon">🛡️</div>
        <div class="scan-ring"></div>
        <div class="scan-pulse"></div>
      </div>
      <div class="analyzer-text">
        <div class="main-text">${text}</div>
        <div class="sub-text">Spam Jam Protection</div>
      </div>
      <div class="progress-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  `;
  document.body.appendChild(analyzer);

  requestAnimationFrame(() => analyzer.classList.add("show"));
}

function removeFloatingStatus() {
  const analyzer = document.querySelector("#spamjam-analyzer");
  if (analyzer) {
    analyzer.classList.add("complete");
    setTimeout(() => {
      analyzer.classList.remove("show");
      setTimeout(() => analyzer.remove(), 400);
    }, 800);
  }
}

/* ===== Suspicious site overlay ===== */
window.showOverlay = function showOverlay(reason, isBlockMode = false) {
  console.log("[content] Showing suspicious overlay...", { isBlockMode });

  if (document.querySelector("#fillit-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "fillit-overlay";
  
  if (isBlockMode) {
    // Block mode - cover entire page and prevent interaction
    overlay.innerHTML = `
      <div id="fillit-popup" class="block-mode">
        <h2>🚫 Site Blocked</h2>
        <p>${reason}</p>
        <p><strong>This site has been blocked for your safety.</strong></p>
        <button id="close-overlay">Go Back</button>
      </div>
    `;
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    overlay.style.backdropFilter = 'blur(10px)';
  } else {
    // Warning mode - just show warning
    overlay.innerHTML = `
      <div id="fillit-popup">
        <h2>⚠️ Suspicious Site Detected</h2>
        <p>${reason}</p>
        <button id="close-overlay">Got it</button>
      </div>
    `;
  }
  
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add("show"));
  overlay.querySelector("#close-overlay").onclick = () => {
    if (isBlockMode) {
      // In block mode, go back to previous page or close tab
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.close();
      }
    } else {
      // In warning mode, just hide overlay
      overlay.classList.remove("show");
      setTimeout(() => overlay.remove(), 300);
    }
  };
};

/* ===== Receive analysis result from background/siteAnalyzer ===== */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "siteAnalysisResult") {
    console.log("[content] Received site analysis result:", msg.data);

    if (msg.data?.is_suspicious) {
      window.showOverlay(msg.data.reason || "This site seems suspicious.");
    } else {
      console.log("[content] Site appears safe ✅");
      // Optionally, you can show a subtle success animation here
    }
  }
  
  // Handle AI status requests from popup
  if (msg.action === "getAIStatus") {
    if (window.getAIStatus) {
      window.getAIStatus().then(status => {
        sendResponse(status);
      });
      return true; // Keep channel open for async response
    } else {
      sendResponse({ isBuiltInAvailable: false });
    }
  }
});
