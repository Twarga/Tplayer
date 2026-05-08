import { createContext, useContext, useEffect, useState } from 'react'
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
    // Ensure dark class is set on mount
    document.documentElement.classList.add('dark')
    
    api.settings.get('theme').then((val) => {
      const t = val === 'light' ? 'light' : 'dark'
      setThemeState(t)
      if (t === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
    }).catch(() => {
      // Default to dark on error
      document.documentElement.classList.add('dark')
    })
    
    api.settings.get('accent_color').then((val) => {
      if (val && ACCENT_COLORS[val]) {
        setAccentState(val)
        document.documentElement.style.setProperty('--accent', ACCENT_COLORS[val])
      }
    }).catch(() => {
      document.documentElement.style.setProperty('--accent', ACCENT_COLORS.amber)
    })
  }, [])

  const setTheme = async (t: Theme) => {
    setThemeState(t)
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
    await api.settings.set('theme', t)
  }

  const setAccent = async (a: string) => {
    setAccentState(a)
    document.documentElement.style.setProperty('--accent', ACCENT_COLORS[a] || ACCENT_COLORS.amber)
    await api.settings.set('accent_color', a)
  }

  return (
    <ThemeContext.Provider value={{ theme, accent, setTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}
