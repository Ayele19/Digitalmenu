import api from './axios.js'

export async function login(username, password) {
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)
  const res = await api.post('/api/auth/login', formData)
  return res.data
}
