import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// For local dev with android emulator use 10.0.2.2, for iOS use localhost
// Use your local IP if running on physical device
const API_URL = 'http://localhost:5001/api';

const client = axios.create({
  baseURL: API_URL,
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

export default client;
