# How to Find Available AI Models (for Google AI Studio)

If you are repeatedly seeing "404 Not Found" or "model not found" errors when using AI features, it means the specific model name the application is trying to use is not available for your API key. My apologies for the previous incorrect instructions. The correct place to check is Google AI Studio.

This guide will walk you through finding the exact, correct model names to use with your Gemini API Key.

---

### Step 1: Visit Google AI Studio

1.  Open the Google AI Studio website in your browser.
    **[https://makersuite.google.com/](https://makersuite.google.com/)**

2.  Sign in with the same Google Account associated with your Google Cloud project and Gemini API Key.

### Step 2: Open a Prompting Interface

1.  Once you are in Google AI Studio, look for an option to create something new. This is often a **"+ Create new"** button in the left-hand menu.
2.  From the options that appear, select **"Freeform prompt"**. This will open the main interface where you can interact with the models.

### Step 3: Find the Model Selection Dropdown

1.  In the new prompt interface, you will see a dropdown menu at the top left, typically above the main text input area. This dropdown shows the currently selected model.
2.  Click on this model name (it might say "Gemini 1.5 Pro" by default).

### Step 4: Identify and Copy the Model Name

1.  A list of available models will appear. These are the models you can use with your API key.
2.  Look for models suitable for conversational tasks. Good candidates are:
    *   **Gemini 1.0 Pro**
    *   **Gemini 1.5 Flash**
    *   **Gemini 1.5 Pro**

3.  The names in this list are what the application needs. The correct format is usually `gemini-1.0-pro` or `gemini-1.5-flash`. **The "-latest" suffix is often not needed.**

### Step 5: Provide the Model Name

Please copy one of the model names from that dropdown (e.g., `gemini-1.0-pro`) and provide it back to me. I will then update the application code to use that exact name, which will resolve the "model not found" errors.
