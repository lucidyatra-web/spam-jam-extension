// scripts/siteAnalyzer.js
window.analyzeSite = async function analyzeSite() {
  console.log("[siteAnalyzer] Running site analysis...");

  try {
    // --- Step 0: Retrieve user settings ---
    const settings = await chrome.storage.local.get({
      mode: "warning", // "warning" or "block"
      chatAnalysis: true,
      trustedSites: [],
    });

    const trustedSites = settings.trustedSites || [];
    const currentDomain = location.hostname.replace("www.", "");

    // --- Step 1: Skip trusted sites ---
    const isTrusted = trustedSites.some(site => currentDomain.includes(site.replace("www.", "")));
    if (isTrusted) {
      console.log(`[siteAnalyzer] Skipped trusted site: ${currentDomain}`);
      return;
    }

    // --- Step 2: Collect basic info ---
    const info = {
      title: document.title,
      url: location.href,
      domain: location.hostname,
      formCount: document.querySelectorAll("form").length,
      inputCount: document.querySelectorAll("input").length,
      linkCount: document.querySelectorAll("a").length,
    };

    // --- Step 3: Extract readable snippets ---
    const headings = Array.from(document.querySelectorAll("h1,h2,h3"))
      .slice(0, 10)
      .map(h => h.innerText.trim())
      .filter(Boolean);

    const firstParagraphs = Array.from(document.querySelectorAll("p"))
      .slice(0, 5)
      .map(p => p.innerText.trim())
      .filter(Boolean);

    const formLabels = Array.from(document.querySelectorAll("label"))
      .slice(0, 10)
      .map(l => l.innerText.trim())
      .filter(Boolean);

    const contentSnippet = { headings, firstParagraphs, formLabels };

    console.log("[siteAnalyzer] Gathered info:", info);
    console.log("[siteAnalyzer] Content snippet:", contentSnippet);

    // --- Step 4: Create prompt for LLM ---
    const prompt = `
You are a cybersecurity assistant. Analyze if this site is suspicious or potentially a scam.

Site information:
${JSON.stringify(info, null, 2)}

Content snippet (important headings, first paragraphs, and form labels):
${JSON.stringify(contentSnippet, null, 2)}

Respond ONLY with JSON:
{ "is_suspicious": true|false, "reason": "short reason" }
`;

    // --- Step 5: Ask LLM (if enabled) ---
    let result = { is_suspicious: false, reason: "Looks safe" };
    if (settings.chatAnalysis !== false) {
      const responseText = await window.askLLM(prompt);
      console.log("[siteAnalyzer] Gemini raw response:", responseText);

      try {
        result = JSON.parse(responseText);
      } catch {
        const match = responseText.match(/\{[\s\S]*\}/);
        result = match ? JSON.parse(match[0]) : result;
      }
    }

    console.log("[siteAnalyzer] Parsed analysis:", result);

    // --- Step 6: Respond according to mode ---
    if (result.is_suspicious) {
      if (settings.mode === "block") {
        console.warn("[siteAnalyzer] Blocking suspicious site!");
        window.showOverlay(result.reason || "This site seems suspicious.", true);
      } else {
        console.warn("[siteAnalyzer] Warning: suspicious site detected.");
        window.showOverlay(result.reason || "This site seems suspicious.");
      }
    } else {
      console.log("[siteAnalyzer] Site appears safe ✅");
    }
  } catch (err) {
    console.error("[siteAnalyzer] Analysis failed:", err);
  }
};
