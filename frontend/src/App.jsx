import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from './context/AuthContext'
import Sidebar from './components/admin/Sidebar'

// Pages
import MenuPage from './pages/customer/MenuPage'
import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import MenuItemsPage from './pages/admin/MenuItemsPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import QRCodePage from './pages/admin/QRCodePage'
import SettingsPage from './pages/admin/SettingsPage'

import './styles/globals.css'
import './styles/AdminLayout.css'

// AdminLayout wraps all protected admin pages with the sidebar
function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-layout-main">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public customer menu */}
          <Route path="/" element={<MenuPage />} />

          {/* Admin login */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* /admin → redirect to dashboard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Protected admin routes wrapped in AdminLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard"  element={<DashboardPage />} />
              <Route path="/admin/menu-items" element={<MenuItemsPage />} />
              <Route path="/admin/categories" element={<CategoriesPage />} />
              <Route path="/admin/qr-code"    element={<QRCodePage />} />
              <Route path="/admin/settings"   element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
