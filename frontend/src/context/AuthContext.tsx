import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, googleAuth as apiGoogleAuth } from '../lib/api'
import type { AuthResponse } from '../lib/api'

export interface User {
  id: string
  username: string
  name: string
  last_name: string
  email: string
  phone: string
  role: string
  blocked: boolean
  email_verified: boolean
  profile_complete: boolean
}

interface AuthContextType {
  token: string | null
  user: User | null
  login: (username: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  googleLogin: (accessToken: string) => Promise<void>
  setAuth: (token: string, user: User, refreshToken?: string) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  })

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  const saveAuth = (res: AuthResponse) => {
    setToken(res.token)
    setUser(res.user)
    if (res.refresh_token) {
      localStorage.setItem('refresh_token', res.refresh_token)
    }
  }

  const login = async (username: string, password: string) => {
    const res = await apiLogin(username, password)
    saveAuth(res)
  }

  const register = async (email: string, password: string, name: string) => {
    const res = await apiRegister(email, password, name)
    saveAuth(res)
  }

  const googleLogin = async (accessToken: string) => {
    const res = await apiGoogleAuth(accessToken)
    saveAuth(res)
  }

  const setAuth = (newToken: string, newUser: User, refreshToken?: string) => {
    setToken(newToken)
    setUser(newUser)
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('refresh_token')
  }

  return (
    <AuthContext.Provider value={{
      token, user, login, register, googleLogin, setAuth, logout,
      isAuthenticated: !!token,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
