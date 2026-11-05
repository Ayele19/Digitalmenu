import React, { createContext, useContext, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const AuthContext = createContext(null)

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1]
    // Pad base64 string if needed
    const padded = base64.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      base64.length + (4 - (base64.length % 4)) % 4,
      '='
    )
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function getStoredToken() {
  return localStorage.getItem('cafe_admin_token')
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken())
  const [admin, setAdmin] = useState(() => {
    const stored = getStoredToken()
    return stored ? decodeJwtPayload(stored) : null
  })

  function login(newToken) {
    localStorage.setItem('cafe_admin_token', newToken)
    setToken(newToken)
    setAdmin(decodeJwtPayload(newToken))
  }

  function logout() {
    localStorage.removeItem('cafe_admin_token')
    setToken(null)
    setAdmin(null)
  }

  const isAuthenticated = Boolean(token)

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  return <Outlet />
}
