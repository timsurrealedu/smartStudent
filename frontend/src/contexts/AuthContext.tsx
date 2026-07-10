import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from '../services/api'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  register: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'smartstudent-token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }

    api.getMe()
      .then((data: any) => {
        if (data?.user) {
          setUser(data.user)
        } else if (data?.id) {
          setUser(data)
        } else {
          localStorage.removeItem(TOKEN_KEY)
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = (token: string, userData: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    setUser(userData)
  }

  const register = (token: string, userData: User) => {
    localStorage.setItem(TOKEN_KEY, token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
