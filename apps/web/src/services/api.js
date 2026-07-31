// API configuration
const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000';
const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8001';

// Token management
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Django Auth API
export const authAPI = {
  async register(username, email, password) {
    const response = await fetch(`${DJANGO_API_URL}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      setTokens(data.access, data.refresh);
    }
    return data;
  },

  async login(username, password) {
    const response = await fetch(`${DJANGO_API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (response.ok) {
      setTokens(data.access, data.refresh);
    }
    return data;
  },

  async refreshToken() {
    const refresh = getRefreshToken();
    if (!refresh) throw new Error('No refresh token');
    
    const response = await fetch(`${DJANGO_API_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    const data = await response.json();
    if (response.ok) {
      setTokens(data.access, data.refresh);
    }
    return data;
  },

  logout() {
    clearTokens();
  },
};

// FastAPI with auth wrapper
const fastAPIRequest = async (endpoint, options = {}) => {
  let token = getAccessToken();
  
  const makeRequest = async (accessToken) => {
    const response = await fetch(`${FASTAPI_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, try to refresh
      try {
        const newTokens = await authAPI.refreshToken();
        return await fetch(`${FASTAPI_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newTokens.access}`,
            ...options.headers,
          },
        });
      } catch (refreshError) {
        authAPI.logout();
        window.location.href = '/login';
        throw refreshError;
      }
    }

    return response;
  };

  return makeRequest(token);
};

// FastAPI endpoints
export const fastAPI = {
  async getBalance(accountNumber) {
    const response = await fastAPIRequest(`/api/balance/${accountNumber}`);
    if (!response.ok) throw new Error('Failed to fetch balance');
    return response.json();
  },

  async getHistory(accountNumber) {
    const response = await fastAPIRequest(`/api/history/${accountNumber}`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  },

  async transfer(fromAccount, toAccount, amount) {
    const response = await fastAPIRequest('/api/transfer', {
      method: 'POST',
      body: JSON.stringify({
        from_account_number: fromAccount,
        to_account_number: toAccount,
        amount: amount,
      }),
    });
    if (!response.ok) throw new Error('Transfer failed');
    return response.json();
  },

  async deposit(accountNumber, amount) {
    const response = await fastAPIRequest(`/api/accounts/${accountNumber}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) throw new Error('Deposit failed');
    return response.json();
  },

  async withdraw(accountNumber, amount) {
    const response = await fastAPIRequest(`/api/accounts/${accountNumber}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) throw new Error('Withdrawal failed');
    return response.json();
  },
};