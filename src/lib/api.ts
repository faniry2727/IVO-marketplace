const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = {
  async get(endpoint: string) {
    const token = localStorage.getItem('ivo_token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const token = localStorage.getItem('ivo_token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw await response.json();
    return response.json();
  },
};
