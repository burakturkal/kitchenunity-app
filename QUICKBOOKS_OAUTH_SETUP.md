# QuickBooks OAuth Setup with Cloudflare Workers

This project uses Cloudflare Workers for secure QuickBooks OAuth token management. The Worker handles OAuth flows while keeping your QuickBooks client secret safe.

## Architecture

- **Frontend**: React app (this repo) - handles user flows
- **Backend**: Cloudflare Workers - manages OAuth and token storage
- **Database**: Supabase - stores tokens and app settings

## Prerequisites

1. **Cloudflare Account** (free tier available) - [cloudflare.com](https://cloudflare.com)
2. **QuickBooks Developer Account** - [developer.intuit.com](https://developer.intuit.com)
3. **Supabase Project** - Already set up in your project
4. **Node.js & npm**
5. **Wrangler CLI** - `npm install -g wrangler`

## Installation & Setup

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```
This opens your browser to authorize Wrangler with your Cloudflare account.

### 3. Deploy the Worker

```bash
npm run worker:deploy
```

After deployment, note your Worker URL (format: `https://quickbooks-oauth-worker.{your-account}.workers.dev`)

### 4. Create a QuickBooks App

1. Go to [QuickBooks Developer Portal](https://developer.intuit.com)
2. Create a new app
3. In **App Settings**, configure:
   - **Redirect URIs**: `https://quickbooks-oauth-worker.{your-subdomain}.workers.dev/api/quickbooks/callback`
   - Copy your **Client ID** and **Client Secret**

### 5. Set Environment Variables in Cloudflare

In the Cloudflare dashboard (**Workers & Pages > Your Worker > Settings > Environment Variables**), add:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon key |
| `QB_CLIENT_ID` | Your QuickBooks Client ID |
| `QB_CLIENT_SECRET` | Your QuickBooks Client Secret |
| `QB_REDIRECT_URI` | `https://quickbooks-oauth-worker.{your-subdomain}.workers.dev/api/quickbooks/callback` |

⚠️ **Never commit secrets to git.** Always set them in the Cloudflare dashboard.

## Using the OAuth Flow

### Connect to QuickBooks

In your React component (e.g., Settings.tsx):

```typescript
const connectQuickBooks = () => {
  const YOUR_WORKER_URL = 'https://quickbooks-oauth-worker.your-subdomain.workers.dev';
  const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${qbClientId}&redirect_uri=${encodeURIComponent(YOUR_WORKER_URL + '/api/quickbooks/callback')}&response_type=code&scope=com.intuit.quickbooks.accounting&state=${storeId}`;
  window.location.href = authUrl;
};
```

### Refresh Expired Tokens

```typescript
const refreshQuickBooksToken = async (storeId) => {
  const YOUR_WORKER_URL = 'https://quickbooks-oauth-worker.your-subdomain.workers.dev';
  const response = await fetch(`${YOUR_WORKER_URL}/api/quickbooks/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ realmId: storeId })
  });
  return response.json();
};
```

## Worker Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/quickbooks/app-info` | Get stored QB app settings |
| `POST` | `/api/quickbooks/app-info` | Save QB credentials |
| `GET` | `/api/quickbooks/callback` | OAuth callback (called by QuickBooks) |
| `POST` | `/api/quickbooks/refresh` | Refresh expired access token |

## Local Development

Test the Worker locally before deploying:

```bash
npm run worker:dev
```
This starts a local environment at `http://localhost:8787`.

## Monitoring

View Worker logs:

```bash
npm run worker:logs
```

## Cost

- **Free Tier**: 100,000 requests/day
- **Beyond Free**: $5/month for unlimited requests
- Suitable for most small-to-medium applications

## Troubleshooting

**"QuickBooks app credentials not found"**
- Ensure environment variables are set in Cloudflare dashboard
- Verify `QB_CLIENT_ID` and `QB_CLIENT_SECRET` are correct

**"Failed to exchange code for token"**
- Confirm `QB_REDIRECT_URI` matches exactly in both:
  - Cloudflare environment variables
  - QuickBooks app settings

**Worker timeout errors**
- Check Supabase connectivity
- Verify API keys are correct
- Check Cloudflare logs for details

## References

- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers Guide](https://developers.cloudflare.com/workers/)
- [QuickBooks OAuth Documentation](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [Supabase REST API](https://supabase.com/docs/reference/javascript/introduction)
