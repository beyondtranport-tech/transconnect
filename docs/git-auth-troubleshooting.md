# How to Fix `git push` Authentication Errors

If you're having trouble pushing your code to GitHub and are being asked for a username and password (or a token), it's almost always because your environment needs a **Personal Access Token (PAT)**. GitHub no longer allows password authentication for Git operations.

This guide will walk you through creating a PAT and using it to push your code.

---

### Step 1: Go to Your GitHub Developer Settings

1.  Go directly to the **Personal Access Tokens** page on GitHub by clicking this link:
    **[https://github.com/settings/tokens](https://github.com/settings/tokens)**

2.  You may be asked to sign in to your GitHub account.

### Step 2: Generate a New Token

1.  On the Personal Access Tokens page, click the **"Generate new token"** button. Select **"Generate new token (classic)"**.

2.  **Note:** Give your token a descriptive name so you remember what it's for, e.g., "Firebase Studio App".

3.  **Expiration:** Set an expiration date. 30 days is a good default for security.

4.  **CRITICAL - Select Scopes:** This is the most important part. You must give the token permission to access your repositories. Check the box next to **`repo`**. This single scope is enough to give you full control over your repositories, including pushing code.

    

5.  Scroll to the bottom and click the green **"Generate token"** button.

### Step 3: Copy and Save Your New Token

1.  After generating the token, you will be shown your new token string. It will start with `ghp_`.

2.  **This is the only time you will see this token.** Copy it immediately and save it somewhere safe and private, like a password manager or a secure note. If you lose it, you will have to generate a new one.

    

### Step 4: Use the Token to Push Your Code

1.  Go back to your terminal in Firebase Studio.

2.  Run the `git push` command again:
    ```bash
    git push
    ```

3.  The terminal will prompt you for your `Username`. Enter your **GitHub username** and press Enter.

4.  The terminal will then prompt you for your `Password`. **Do NOT enter your GitHub password.** Instead, **paste the Personal Access Token (PAT)** you copied in Step 3.
    *Note: When you paste the token, it might not show any characters on the screen. This is a normal security feature. Just paste it and press Enter.*

After you enter the token, your code should push successfully to your GitHub repository. Your environment should remember this token for future pushes, but it's good practice to keep the token saved in a secure place in case you need it again.