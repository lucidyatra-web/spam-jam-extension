const GEMINI_API_KEY = "AIzaSyCOxHLUVqrKVJQWHz-5QmisrtE6bakXWOE";// safe here

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "askGemini") {
    ("[Background] Gemini request received.");

    (async () => {
      try {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": GEMINI_API_KEY
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: msg.prompt }] }]
            })
          }
        );

        const data = await res.json();
        ("[Background] Gemini raw:", data);

        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          "[No response]";

        ("[Background] Gemini responded successfully.");
        sendResponse({ success: true, text });
      } catch (err) {
        console.error("[Background] Gemini call failed:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();

    // 👇 This is CRUCIAL — tells Chrome to keep channel alive for async sendResponse
    return true;
  }
  
});

