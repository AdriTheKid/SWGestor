import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3003'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
})

export async function healthCheck(){
  const { data } = await api.get('/api/health')
  return data
}
