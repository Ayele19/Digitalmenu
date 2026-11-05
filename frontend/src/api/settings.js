import api from './axios.js'

export const getSettings = () => api.get('/api/settings').then(r => r.data)
export const updateSettings = (data) => api.put('/api/settings', data).then(r => r.data)
export const uploadLogo = (file) => {
  const formData = new FormData()
  formData.append('logo', file)
  return api.post('/api/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}
