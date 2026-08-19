/**
 * context/AuthContext.jsx
 *
 * Keeps track of who is logged in and their role, and exposes
 * login() / register() / logout(). Wrap the whole app with
 * <AuthProvider> once in main.jsx / App.jsx.
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { api, saveTokens, clearTokens, apiErrorMessage } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
  }, [user])

  async function login(email, password) {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const { access_token, refresh_token, user: loggedInUser } = res.data.data
      saveTokens({ access_token, refresh_token })
      setUser(loggedInUser)
      return { success: true }
    } catch (error) {
      return { success: false, message: apiErrorMessage(error), errors: error?.response?.data?.errors }
    } finally {
      setLoading(false)
    }
  }

  async function register(payload) {
    setLoading(true)
    try {
      await api.post('/auth/register', payload)
      return { success: true }
    } catch (error) {
      return { success: false, message: apiErrorMessage(error), errors: error?.response?.data?.errors }
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // even if the request fails, still clear the local session
    }
    clearTokens()
    setUser(null)
  }

  const value = {
    user,
    role: user?.role,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
