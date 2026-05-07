import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '@/lib/ipc'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  accent: string
  setTheme: (theme: Theme) => void
  setAccent: (accent: string) => void
}

const ACCENT_COLORS: Record<string, string> = {
  amber: '#E8A87C',
  green: '#1DB954',
  blue: '#1E90FF',
  purple: '#8B5CF6',
  orange: '#F97316',
  pink: '#EC4899',
  red: '#EF4444',
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  accent: 'amber',
  setTheme: () => {},
  setAccent: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [accent, setAccentState] = useState('amber')

  useEffect(() => {
    api.settings.get('theme').then((val) => {
      if (val === 'light' || val === 'dark') {
        setThemeState(val)
        document.documentElement.classList.toggle('dark', val === 'dark')
      }
    })
    api.settings.get('accent_color').then((val) => {
      if (val && ACCENT_COLORS[val]) setAccentState(val)
    })
  }, [])

  const setTheme = async (t: Theme) => {
    setThemeState(t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    await api.settings.set('theme', t)
  }

  const setAccent = async (a: string) => {
    setAccentState(a)
    document.documentElement.style.setProperty('--accent', ACCENT_COLORS[a] || ACCENT_COLORS.amber)
    await api.settings.set('accent_color', a)
  }

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', ACCENT_COLORS[accent] || ACCENT_COLORS.amber)
  }, [accent])

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}