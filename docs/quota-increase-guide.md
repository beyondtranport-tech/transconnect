# How to Handle "Resource Exhausted" Errors on a Blaze Plan

If your application is on the Blaze (pay-as-you-go) plan and you are still encountering "Resource Exhausted" errors, it typically means you are hitting a specific API's rate limit or quota, not your Firebase billing limit. This is common when using Google Cloud services like the Gemini API (for AI features) or the Custom Search API.

This guide will show you how to identify the specific quota you're hitting and how to request an increase.

---

## Step 1: Identify the Exhausted Resource in Google Cloud Console

1.  Open the **Quotas** page in the Google Cloud Console for your project. A direct link is provided below:
    **[https://console.cloud.google.com/iam-admin/quotas?project=ecosystem-hub](https://console.cloud.google.com/iam-admin/quotas?project=ecosystem-hub)**
    *(Ensure the correct project, `ecosystem-hub`, is selected at the top of the page.)*

2.  You will see a list of all quotas for your project. You need to find the specific service that is causing the error. Use the **"Filter"** bar at the top.

## Step 2: Check Common APIs

Here are the most common APIs in this application that might cause "Resource Exhausted" errors:

### For AI and Generative Features (Gemini):

1.  In the filter bar, type **"Generative Language API"**.
2.  Look for quotas like **"Generate content requests per minute"** or **"Generate content requests per minute per project"**.
3.  Check the **"Usage"** column. If the usage is at or near 100%, you have found the bottleneck.

### For the AI Lead Generation Agent (Google Search):

1.  In the filter bar, type **"Custom Search API"**.
2.  Look for the quota named **"Queries per day"**. The free plan is limited to 100 queries per day.
3.  Check the **"Usage"** column. If it's at 100%, this is your issue.

---

## Step 3: Request a Quota Increase

Once you have identified the specific quota that is at its limit:

1.  Check the box next to the quota you want to increase.
2.  An **"EDIT QUOTAS"** button will appear at the top of the list. Click it.
3.  A panel will open on the right side of the screen.
4.  Enter your desired new limit. It's best to request a reasonable increase based on your expected usage.
5.  You may need to provide a brief justification for the increase. Explain your application's use case (e.g., "AI-powered lead generation feature for our logistics platform users").
6.  Click **"SUBMIT REQUEST"**.

---

## What Happens Next?

*   Some quota increase requests are approved automatically and almost instantly.
*   Others, especially for newer or high-demand services, may require manual review by Google's team, which can take 1-2 business days. You will receive an email notification about the status of your request.

By following these steps, you can resolve resource exhaustion errors and ensure your application scales smoothly as your user base grows.
