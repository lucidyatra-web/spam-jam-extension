// scripts/askLLM.js - Smart AI handler with built-in AI + cloud fallback

class ContentAIService {
  constructor() {
    this.builtInSession = null;
    this.isBuiltInAvailable = false;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log("[ContentAI] Checking built-in AI availability...");
    
    try {
      if ('ai' in window && 'languageModel' in window.ai) {
        const availability = await window.ai.languageModel.availability();
        console.log("[ContentAI] Built-in AI availability:", availability);
        
        if (availability === 'readily-available' || availability === 'after-download') {
          await this.initializeBuiltInAI();
        } else {
          console.log("[ContentAI] Built-in AI not available");
          this.isBuiltInAvailable = false;
        }
      } else {
        console.log("[ContentAI] Built-in AI API not found");
        this.isBuiltInAvailable = false;
      }
    } catch (error) {
      console.warn("[ContentAI] Error checking built-in AI:", error);
      this.isBuiltInAvailable = false;
    }
    
    this.isInitialized = true;
    console.log(`[ContentAI] Initialized - Built-in AI: ${this.isBuiltInAvailable ? 'Available' : 'Not Available'}`);
  }

  async initializeBuiltInAI() {
    try {
      console.log("[ContentAI] Creating built-in AI session...");
      
      this.builtInSession = await window.ai.languageModel.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            const progress = Math.round(e.loaded * 100);
            console.log(`[ContentAI] Model download: ${progress}%`);
            
            // Show download progress in page title temporarily
            if (progress < 100) {
              document.title = `[AI Download ${progress}%] ${document.title.replace(/^\[AI Download \d+%\] /, '')}`;
            } else {
              document.title = document.title.replace(/^\[AI Download \d+%\] /, '');
            }
          });
        }
      });
      
      this.isBuiltInAvailable = true;
      console.log("[ContentAI] Built-in AI session created!");
      
      // Clean up title if needed
      document.title = document.title.replace(/^\[AI Download \d+%\] /, '');
      
    } catch (error) {
      console.warn("[ContentAI] Failed to create built-in AI session:", error);
      this.isBuiltInAvailable = false;
      this.builtInSession = null;
      
      // Clean up title on error
      document.title = document.title.replace(/^\[AI Download \d+%\] /, '');
    }
  }

  async askBuiltInAI(prompt) {
    if (!this.isBuiltInAvailable || !this.builtInSession) {
      throw new Error("Built-in AI not available");
    }
    
    const response = await this.builtInSession.prompt(prompt);
    return response;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isBuiltInAvailable: this.isBuiltInAvailable,
      hasBuiltInSession: !!this.builtInSession
    };
  }
}

// Create global instance
const contentAI = new ContentAIService();

// Main askLLM function
window.askLLM = async function askLLM(promptText) {
  console.log("[askLLM] Processing AI request...");
  
  // Initialize if needed
  await contentAI.initialize();
  
  // Try built-in AI first
  if (contentAI.isBuiltInAvailable) {
    try {
      console.log("[askLLM] Trying built-in AI...");
      const response = await contentAI.askBuiltInAI(promptText);
      console.log("[askLLM] Built-in AI response received");
      return response;
    } catch (error) {
      console.warn("[askLLM] Built-in AI failed, falling back to cloud:", error);
    }
  }
  
  // Fallback to cloud API via background script
  console.log("[askLLM] Using cloud API fallback...");
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "askGemini", prompt: promptText },
      (response) => {
        console.log("[askLLM] Cloud API response received:", response);

        if (!response || !response.success) {
          console.warn("[askLLM] Cloud API request failed:", response?.error);
          resolve("[Error: AI request failed]");
          return;
        }

        console.log("[askLLM] Cloud API response:", response.text);
        resolve(response.text);
      }
    );
  });
};

// Helper function to check AI status
window.getAIStatus = async function getAIStatus() {
  await contentAI.initialize();
  return contentAI.getStatus();
};
