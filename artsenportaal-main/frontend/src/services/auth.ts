import axios from 'axios';

const API_URL = 'http://localhost:1337';

export interface LoginResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export const login = async (identifier: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('Attempting login with:', { identifier });
    
    const response = await axios.post(`${API_URL}/api/auth/local`, {
      identifier,
      password,
    });

    console.log('Full response data:', JSON.stringify(response.data, null, 2));
    
    // Store the JWT token and user data
    localStorage.setItem('token', response.data.jwt);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  return JSON.parse(userStr);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const isDoctor = () => {
  const user = getCurrentUser();
  return user?.username?.toLowerCase() === 'doctor';
};

export const isResearcher = () => {
  const user = getCurrentUser();
  return user?.username?.toLowerCase() === 'researcher';
}; 