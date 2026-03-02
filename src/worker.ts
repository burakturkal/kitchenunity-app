// src/worker.ts
// Cloudflare Worker for QuickBooks OAuth management

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  QB_CLIENT_ID: string;
  QB_CLIENT_SECRET: string;
  QB_REDIRECT_URI: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

// Helper to make Supabase requests
async function supabaseRequest(env: Env, table: string, method: string, data?: any) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const headers = {
    'apikey': env.SUPABASE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.statusText}`);
  }

  return response.json();
}

// GET /api/quickbooks/app-info
async function getAppInfo(env: Env) {
  try {
    const result = await supabaseRequest(env, 'quickbooks_app_settings', 'GET');
    return new Response(JSON.stringify({ success: true, appInfo: result[0] || null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to fetch app info', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST /api/quickbooks/app-info
async function saveAppInfo(env: Env, request: Request) {
  try {
    const body = await request.json();
    const { clientId, clientSecret, redirectUri } = body;

    await supabaseRequest(env, 'quickbooks_app_settings', 'POST', {
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    return new Response(JSON.stringify({ success: true, message: 'App info saved' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Failed to save app info', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET /api/quickbooks/callback?code=AUTH_CODE&realmId=STORE_ID
async function handleCallback(env: Env, request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const realmId = url.searchParams.get('realmId');

    if (!code || !realmId) {
      throw new Error('Missing code or realmId');
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth.platform.intuit.com/oauth2/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.QB_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Save token to Supabase (stores table)
    await supabaseRequest(env, 'stores', 'PATCH', {
      quickbooks_token: tokenData,
    });

    // Redirect user back to dashboard with success message
    return new Response(
      `<html><body><h1>QuickBooks Connected!</h1><p>You can close this window.</p></body></html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (err: any) {
    return new Response(
      `<html><body><h1>OAuth Failed</h1><p>${err.message}</p></body></html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// POST /api/quickbooks/refresh
async function handleRefresh(env: Env, request: Request) {
  try {
    const body = await request.json();
    const { realmId } = body;

    if (!realmId) {
      throw new Error('Missing realmId');
    }

    // Get current token from Supabase
    const stores = await supabaseRequest(env, `stores?id=eq.${realmId}`, 'GET');
    if (!stores || stores.length === 0) {
      throw new Error('Store not found');
    }

    const tokenData = stores[0].quickbooks_token;
    if (!tokenData) {
      throw new Error('No QuickBooks token found');
    }

    // Refresh token
    const refreshResponse = await fetch('https://oauth.platform.intuit.com/oauth2/tokens/bearer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${env.QB_CLIENT_ID}:${env.QB_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
      }).toString(),
    });

    if (!refreshResponse.ok) {
      throw new Error('Failed to refresh token');
    }

    const newTokenData = await refreshResponse.json();

    // Save new token
    await supabaseRequest(env, 'stores', 'PATCH', {
      quickbooks_token: newTokenData,
    });

    return new Response(JSON.stringify({ success: true, token: newTokenData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Refresh failed', details: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Main Worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (method === 'OPTIONS') {
      return new Response('OK', { headers: corsHeaders });
    }

    try {
      // Route handlers
      if (pathname === '/api/quickbooks/app-info' && method === 'GET') {
        return await getAppInfo(env);
      } else if (pathname === '/api/quickbooks/app-info' && method === 'POST') {
        return await saveAppInfo(env, request);
      } else if (pathname === '/api/quickbooks/callback' && method === 'GET') {
        return await handleCallback(env, request);
      } else if (pathname === '/api/quickbooks/refresh' && method === 'POST') {
        return await handleRefresh(env, request);
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (err: any) {
      return new Response(JSON.stringify({ error: 'Internal error', details: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
