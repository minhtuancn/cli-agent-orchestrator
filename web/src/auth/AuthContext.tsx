import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setUnauthorizedHandler } from '../api'

interface AuthCtx {
  authenticated: boolean
  loading: boolean
  login: (password: string, remember?: boolean) => Promise<boolean>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuth] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api
      .me()
      .then((r) => {
        if (active) setAuth(r.authenticated)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    // When any API call returns 401 the session is gone -> show login.
    setUnauthorizedHandler(() => setAuth(false))
    return () => {
      active = false
      setUnauthorizedHandler(null)
    }
  }, [])

  const login = async (password: string, remember = false): Promise<boolean> => {
    try {
      const r = await api.login(password, remember)
      if (r.ok) {
        setAuth(true)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      /* ignore network errors on logout */
    }
    setAuth(false)
  }

  return (
    <Ctx.Provider value={{ authenticated, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}
