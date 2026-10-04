# YouTube Integration Setup

Follow these steps to set up the real YouTube OAuth and Analytics integration for CreatorAI.

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.

## 2. Enable Required APIs
1. In the Google Cloud Console, navigate to **APIs & Services > Library**.
2. Search for and enable the **YouTube Data API v3**.
3. Search for and enable the **YouTube Analytics API**.

## 3. Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (or Internal if using Google Workspace).
3. Fill in the required application details (App name: CreatorAI, Support email, etc.).
4. Click **Save and Continue**.
5. Add the following scopes:
   - `.../auth/youtube.readonly`
   - `.../auth/yt-analytics.readonly`
6. Add your test users (the Google accounts you will use to log into YouTube).

## 4. Create OAuth Credentials
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials** and select **OAuth client ID**.
3. Set the **Application type** to **Web application**.
4. Set the name to "CreatorAI Web".
5. Add the following **Authorized redirect URIs**:
   - `http://localhost:3000/dashboard/integrations/youtube/callback`
6. Click **Create**.

## 5. Configure Environment Variables
Copy the generated Client ID and Client Secret, and update your `.env` file (or `.env.example` in development):

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/dashboard/integrations/youtube/callback
```

## 6. Run CreatorAI
Restart the CreatorAI server:
```bash
python run_all.py
```

## 7. Connect YouTube
1. Open the CreatorAI Dashboard.
2. Navigate to the **Analytics** tab.
3. Click the **Connect YouTube** button.
4. Complete the OAuth flow to see live data directly from your YouTube channel!
