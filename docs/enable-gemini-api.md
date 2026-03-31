# How to Fix AI Feature "403 Forbidden" Errors

If you are seeing a "403 Forbidden" or "API is blocked" error when trying to use AI features like the image generator, it means the necessary Google Cloud API is not enabled for your project. Here’s how to fix it.

## Step 1: Go to the API Library in Google Cloud Console

1.  Open the Google Cloud Console for your project.
2.  Use this direct link to go to the API Library:
    **[https://console.cloud.google.com/apis/library?project=ecosystem-hub](https://console.cloud.google.com/apis/library?project=ecosystem-hub)**
    *(Ensure your project `ecosystem-hub` is selected at the top of the page.)*

## Step 2: Search for and Enable the API

1.  In the search bar at the top of the API Library, type:
    `Generative Language API`
2.  Click on the **"Generative Language API"** result in the search list.
3.  You will see a page describing the API. Click the blue **"Enable"** button.

It may take a minute or two for the API to be fully enabled across Google's systems.

## Step 3: Wait and Retry

After enabling the API, please wait a couple of minutes and then try using the AI image generator again. The "403 Forbidden" error should now be resolved.

**Note:** If you've just created a new project or enabled billing, it can sometimes take up to 5-10 minutes for all permissions to propagate.
