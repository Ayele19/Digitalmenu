import api from './axios.js'

export const getCategories = () => api.get('/api/categories').then(r => r.data)
export const createCategory = (data) => api.post('/api/categories', data).then(r => r.data)
export const updateCategory = (id, data) => api.put(`/api/categories/${id}`, data).then(r => r.data)
export const deleteCategory = (id, force = false) =>
  api.delete(`/api/categories/${id}${force ? '?force=true' : ''}`).then(r => r.data)
export const reorderCategory = (id, display_order) =>
  api.patch(`/api/categories/${id}/reorder`, { display_order }).then(r => r.data)
