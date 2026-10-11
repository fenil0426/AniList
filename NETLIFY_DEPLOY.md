# Deploying AniHub to Netlify (1 Minute)

Netlify allows you to publish this website instantly for free by dragging the production build.

---

### Step 1: Get the Deploy Package
You have a ready-to-deploy package created for you:
- **`anihub-netlify.zip`** (contains the compiled `index.html`, assets, and `_redirects` for smooth page routing).
- Or you can drag the **`dist`** folder directly.

---

### Step 2: Drag and Drop into Netlify
1. Go to **[app.netlify.com/drop](https://app.netlify.com/drop)** (or log in to Netlify).
2. Drag and drop **`anihub-netlify.zip`** (or the **`dist`** folder) directly into the upload box on that page.
3. Netlify will build and deploy it in about 5 seconds.
4. Your website is now live! (e.g. `https://anihub-XXXXXX.netlify.app`).

---

### Step 3: Enable Google Sign-In for Your Netlify Domain
To allow users to sign in with Google from your new Netlify address:
1. Open your **[Firebase Console](https://console.firebase.google.com/project/anilist-27488/authentication/settings)**.
2. In the left menu, go to **Authentication → Settings → Authorized domains**.
3. Click **Add domain** and enter your Netlify address (e.g., `anihub-XXXXXX.netlify.app` without `https://`).
4. Click **Save**.

That's it! Your AniHub website is live with real-time AniList anime schedules and Google Cloud sync!
