// quickbooks.service.ts
// Handles QuickBooks OAuth, token management, and API calls

import axios from 'axios';

const QUICKBOOKS_BASE_URL = 'https://quickbooks.api.intuit.com/v3/company';

export async function exchangeCodeForToken(code: string, redirectUri: string, clientId: string, clientSecret: string) {
  const url = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(url, params, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
  });
  return response.data;
}

export async function refreshToken(refreshToken: string, clientId: string, clientSecret: string) {
  const url = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(url, params, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
  });
  return response.data;
}

export async function getQuickBooksData(companyId: string, accessToken: string, resource: string) {
  const url = `${QUICKBOOKS_BASE_URL}/${companyId}/${resource}`;
  const response = await axios.get(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });
  return response.data;
}

export async function pushQuickBooksData(companyId: string, accessToken: string, resource: string, data: any) {
  const url = `${QUICKBOOKS_BASE_URL}/${companyId}/${resource}`;
  const response = await axios.post(url, data, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}
