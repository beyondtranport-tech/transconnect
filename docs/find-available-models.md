# How to Find Available AI Models in Your Project

If you are repeatedly seeing "404 Not Found" or "model not found" errors when using AI features, it means the specific model name the application is trying to use is not enabled or available in your Google Cloud project.

This guide will walk you through finding the exact, correct model ID to provide back to the AI assistant.

---

### Step 1: Go to the Vertex AI Model Garden

1.  Open the Google Cloud Console and navigate to the **Vertex AI Model Garden**. A direct link is provided below.

    **[https://console.cloud.google.com/vertex-ai/model-garden](https://console.cloud.google.com/vertex-ai/model-garden)**

2.  **CRITICAL:** At the top of the page, ensure the correct Google Cloud project is selected (e.g., `ecosystem-hub`).

### Step 2: Find Google's Foundational Models

1.  The Model Garden displays models from various publishers. You need to find Google's models.
2.  Look for a filter section, often on the left side of the page. Under **"Publisher"**, make sure **"Google"** is selected.

### Step 3: Locate a Suitable Gemini Model

1.  In the list of models, look for the "Gemini" family of models.
2.  You are looking for a general-purpose, text-based model. Good candidates will have names like:
    *   **Gemini 1.0 Pro**
    *   **Gemini 1.5 Flash**
    *   **Gemini 1.5 Pro**
3.  Click on one of these model cards to view its details. Avoid models with "Vision" or "Ultra" in the name for now, as they may have different APIs.

### Step 4: Find and Copy the Model ID

This is the most important step.

1.  On the model's detail page, look for a section or field labeled **"Model ID"** or **"API Identifier"**.
2.  This ID is what the application needs to use. It will be a string in a code-like format.
3.  **Copy this entire ID exactly as it appears.**

    Examples of what a Model ID might look like:
    *   `gemini-1.0-pro-001`
    *   `gemini-1.5-flash-preview-0514`
    *   `gemini-1.5-pro-001`

### Step 5: Provide the Model ID

Once you have copied the exact Model ID, please paste it back into our chat. I will then use that exact ID to update the application code, which will resolve the "model not found" errors.
