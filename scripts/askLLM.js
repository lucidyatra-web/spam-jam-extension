// scripts/askLLM.js
window.askLLM = async function askLLM(promptText) {
  ("[askLLM] Sending Gemini request to background...");

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "askGemini", prompt: promptText },
      (response) => {
        ("[askLLM] Response received from background:", response);

        if (!response || !response.success) {
          console.warn("[askLLM] Gemini request failed:", response?.error);
          resolve("[Error: Gemini request failed]");
          return;
        }

        ("[askLLM] Gemini response text:", response.text);
        resolve(response.text);
      }
    );
  });
};
