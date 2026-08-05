import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

// Dynamic host resolution helper for multi-device & LAN support
export function getBaseHost() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    // If backend is on same host or local web dev port
    return `${protocol}//${host}:5001`;
  }
  // Mobile fallback
  return 'http://localhost:5001';
}

const API_URL = `${getBaseHost()}/api`;

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
