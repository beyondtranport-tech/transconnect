# Setting up Google Custom Search API for Lead Generation

To enable the AI Lead Agent to find real-world company data, you need to configure Google's Custom Search JSON API. This requires two things: an **API Key** and a **Programmable Search Engine ID**.

## Step 1: Get Your Google Cloud API Key

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select your project (e.g., `transconnect-v1-39578841-2a857`) from the top navigation bar.
3.  In the navigation menu (hamburger icon), go to **APIs & Services > Credentials**.
4.  Click **+ CREATE CREDENTIALS** at the top and select **API key**.
5.  A new API key will be created. Copy this key.
6.  **Important:** For security, it's recommended to restrict this key. Click on the new key, and under "API restrictions", select "Restrict key" and choose the "Custom Search API".
7.  Paste this key into your `.env` file as the value for `GOOGLE_SEARCH_API_KEY`.

## Step 2: Create a Programmable Search Engine

1.  Go to the [Programmable Search Engine control panel](https://programmablesearchengine.google.com/controlpanel/all).
2.  Click **Add** to create a new search engine.
3.  In the "What to search?" section, enter a valid website to search (e.g., `www.google.com`). This is just a starting point and doesn't limit your searches.
4.  Give your search engine a name (e.g., "TransConnect Lead Finder").
5.  Click **Create**.
6.  Once created, click on **Customize**.
7.  Under the "Basics" tab, you will find the **Search engine ID**. Copy this ID.
8.  In the same section, make sure to turn **ON** the "Search the entire web" option. This is crucial for the tool to work correctly.
9.  Click **Save Changes** if you made any.
10. Paste the Search Engine ID into your `.env` file as the value for `CUSTOM_SEARCH_ENGINE_ID`.

Once both values are in your `.env` file, the AI Lead Agent will be fully functional and able to search for real companies.
