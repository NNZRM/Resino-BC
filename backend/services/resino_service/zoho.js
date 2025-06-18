import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config(); // Automatically loads from default `.env` in container

// Read initial tokens from environment
let ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

console.log("config", {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  CLIENT_ID,
  CLIENT_SECRET
});

// 🔁 Refresh the access token (in memory only)
async function refreshAccessToken() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: REFRESH_TOKEN
  });

  try {
    const response = await axios.post('https://accounts.zoho.eu/oauth/v2/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const newToken = response.data.access_token;
    console.log('✅ Refreshed Access Token:', newToken);

    // 🔄 Update in-memory token (not the .env file)
    ACCESS_TOKEN = newToken;

    return newToken;
  } catch (error) {
    console.error('❌ Failed to refresh token:', error.response?.data || error.message);
    throw error;
  }
}

// 🔍 Fetch account data from Zoho CRM
export async function fetchAccount(id) {
  try {
    const response = await axios.get(`https://www.zohoapis.eu/crm/v8/Accounts/${id}`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${ACCESS_TOKEN}`
      },
      params: {
        fields: 'id,Account_Name,Konto_Nummer1'
      }
    });

    const account = response.data.data[0];
    console.log('📦 Account:', account);
    return account.Konto_Nummer1;
  } catch (error) {
    if (error.response?.status === 401) {
      console.warn('⚠️ Token expired. Refreshing...');
      await refreshAccessToken();
      return fetchAccount(id); // 🔁 Retry after refresh
    }

    console.error('❌ Failed to fetch account:', error.response?.data || error.message);
    return null;
  }
}
