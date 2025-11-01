// Background script - handles cloud API fallback
const GEMINI_API_KEY = "AIzaSyCOxHLUVqrKVJQWHz-5QmisrtE6bakXWOE";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "askGemini") {
    console.log("[Background] Cloud API request received.");

    (async () => {
      try {
        const response = await fetch(
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

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (!text) {
          throw new Error("No response from API");
        }

        console.log("[Background] Cloud API responded successfully");
        sendResponse({ 
          success: true, 
          text: text,
          source: 'cloud' 
        });
      } catch (err) {
        console.error("[Background] Cloud API failed:", err);
        sendResponse({ 
          success: false, 
          error: err.message 
        });
      }
    })();

    // Keep channel alive for async sendResponse
    return true;
  }
});

