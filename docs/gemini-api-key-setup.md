# Setting up Your Gemini API Key

To enable the AI features in your application, such as the Lead Research Agent, you need a Gemini API key. This is a separate key from the Google Search API key.

## Step 1: Get Your Gemini API Key

1.  Visit the **[Google AI Studio](https://makersuite.google.com/app/apikey)**.
2.  You may be prompted to log in with your Google account and agree to the terms of service.
3.  Click the "**Create API key**" button.
4.  A new API key will be generated for you. **Copy this key immediately** and save it somewhere safe. This is your `GEMINI_API_KEY`.

## Step 2: Update Your `.env` File

You now have the required key. Paste it into your `.env` file in the root of your project.

```
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

That's it! Once you save the `.env` file, the AI features in your application will be fully functional.
