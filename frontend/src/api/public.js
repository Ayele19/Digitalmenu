import api from './axios.js'

export const getPublicSettings = () => api.get('/api/public/settings').then(r => r.data)
export const getPublicMenu = () => api.get('/api/public/menu').then(r => r.data)
export const getPublicCategories = () => api.get('/api/public/categories').then(r => r.data)
