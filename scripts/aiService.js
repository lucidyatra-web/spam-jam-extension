// scripts/aiService.js - Smart AI service with built-in AI + cloud fallback

class AIService {
    constructor() {
        this.builtInSession = null;
        this.isBuiltInAvailable = false;
        this.isInitialized = false;
        this.GEMINI_API_KEY = "AIzaSyCOxHLUVqrKVJQWHz-5QmisrtE6bakXWOE";
    }

    async initialize() {
        if (this.isInitialized) return;

        console.log("[AIService] Initializing AI service...");

        // Check if built-in AI is available
        try {
            // Note: Built-in AI is only available in content scripts, not service workers
            // So we'll handle this differently in the background script
            if (typeof window !== 'undefined' && 'ai' in window && 'languageModel' in window.ai) {
                const availability = await window.ai.languageModel.availability();
                console.log("[AIService] Built-in AI availability:", availability);

                if (availability === 'readily-available') {
                    await this.initializeBuiltInAI();
                } else if (availability === 'after-download') {
                    console.log("[AIService] Built-in AI needs download, will try to initialize...");
                    await this.initializeBuiltInAI();
                } else {
                    console.log("[AIService] Built-in AI not available, will use cloud API");
                    this.isBuiltInAvailable = false;
                }
            } else {
                console.log("[AIService] Built-in AI API not found (likely in service worker), using cloud API");
                this.isBuiltInAvailable = false;
            }
        } catch (error) {
            console.warn("[AIService] Error checking built-in AI availability:", error);
            this.isBuiltInAvailable = false;
        }

        this.isInitialized = true;
        console.log(`[AIService] Initialized - Built-in AI: ${this.isBuiltInAvailable ? 'Available' : 'Not Available'}`);
    }

    async initializeBuiltInAI() {
        try {
            console.log("[AIService] Creating built-in AI session...");

            this.builtInSession = await window.ai.languageModel.create({
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        console.log(`[AIService] Model download progress: ${Math.round(e.loaded * 100)}%`);
                    });
                }
            });

            this.isBuiltInAvailable = true;
            console.log("[AIService] Built-in AI session created successfully!");

        } catch (error) {
            console.warn("[AIService] Failed to create built-in AI session:", error);
            this.isBuiltInAvailable = false;
            this.builtInSession = null;
        }
    }

    async askAI(prompt) {
        await this.initialize();

        // Try built-in AI first
        if (this.isBuiltInAvailable && this.builtInSession) {
            try {
                console.log("[AIService] Using built-in AI...");
                const response = await this.builtInSession.prompt(prompt);
                console.log("[AIService] Built-in AI response received");
                return { success: true, text: response, source: 'built-in' };
            } catch (error) {
                console.warn("[AIService] Built-in AI failed, falling back to cloud:", error);
                // Don't return here, fall through to cloud API
            }
        }

        // Fallback to cloud API
        try {
            console.log("[AIService] Using cloud API...");
            const response = await this.callCloudAPI(prompt);
            console.log("[AIService] Cloud API response received");
            return { success: true, text: response, source: 'cloud' };
        } catch (error) {
            console.error("[AIService] Both AI methods failed:", error);
            return { success: false, error: error.message };
        }
    }

    async callCloudAPI(prompt) {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": this.GEMINI_API_KEY
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Cloud API request failed: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!text) {
            throw new Error("No response from cloud API");
        }

        return text;
    }

    // Get current AI status for debugging
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isBuiltInAvailable: this.isBuiltInAvailable,
            hasBuiltInSession: !!this.builtInSession
        };
    }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIService;
} else {
    window.AIService = AIService;
}