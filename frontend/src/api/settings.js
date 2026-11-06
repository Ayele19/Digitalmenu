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
export const uploadVideo = (file, onProgress) => {
  const formData = new FormData()
  formData.append('video', file)
  return api.post('/api/settings/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  }).then(r => r.data)
}
