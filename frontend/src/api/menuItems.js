import api from './axios.js'

export const getMenuItems = () => api.get('/api/menu-items').then(r => r.data)
export const getMenuItem = (id) => api.get(`/api/menu-items/${id}`).then(r => r.data)

export const createMenuItem = (formData) =>
  api.post('/api/menu-items', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)

export const updateMenuItem = (id, formData) =>
  api.put(`/api/menu-items/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)

export const deleteMenuItem = (id) =>
  api.delete(`/api/menu-items/${id}`).then(r => r.data)

export const toggleAvailability = (id) =>
  api.patch(`/api/menu-items/${id}/toggle-availability`).then(r => r.data)
