# KitchenUnity Lead SMS — Chrome Extension

Auto-texts new leads from your Google Voice number the moment they come in.

## How it works

1. Extension runs silently inside your Google Voice tab
2. Every 30 seconds it checks Supabase for new leads
3. When a new lead is found, it automatically types and sends a text through the Google Voice web UI
4. Each lead is only texted once (tracked in extension storage)

---

## Setup (one time)

### Step 1: Load the extension

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder from this project

### Step 2: Configure the extension

1. Click the extension icon in your toolbar → **Open Settings**
2. Fill in:
   - **Supabase URL**: `https://ffhdrhvstaonvcludbgn.supabase.co`
   - **Supabase Anon Key**: Copy from `src/services/supabase.ts` (the long `eyJ...` string)
   - **Store ID**: Your store's UUID (see below for how to find it)
   - **Store Name**: e.g. "KitchenUnity Cabinets"
   - **Message Template**: Customize the text (use `{name}` and `{store}` placeholders)
3. Click **Test Connection** to verify it works
4. Click **Save Settings**

### Step 3: Keep Google Voice open

- Open `https://voice.google.com` in a Chrome tab and stay logged in
- Keep Chrome running (you can minimize it)
- That's it — leads will auto-text from now on

---

## Finding your Store ID

Your Store ID is a UUID like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

**Option A** — From your browser console while on the app:
1. Open your KitchenUnity app
2. Press F12 → Console
3. Run: `localStorage` and look for any store-related keys
   OR check the Network tab for any API calls containing a store UUID

**Option B** — Ask your developer — it's in the `stores` table in Supabase under your store's row.

---

## Troubleshooting

**Texts aren't sending:**
- Make sure voice.google.com is open and you're logged in
- Open DevTools on the voice.google.com tab → Console tab → look for `[KU SMS]` log messages
- Google Voice may have updated their UI — the selectors in `content.js` may need updating

**Getting "Not configured" in the popup:**
- Open extension options and fill in all three required fields (URL, Key, Store ID)

**Same lead texted twice:**
- This shouldn't happen — the extension stores sent lead IDs in `chrome.storage.local`
- If it does, check that the same extension isn't loaded twice in `chrome://extensions`
