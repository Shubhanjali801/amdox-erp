import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light'
interface ThemeContextType { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void }

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to light — the landing/auth pages are light-first, so a fresh
  // visitor (no saved preference) must not land in dark mode (white-on-white).
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'light'
  )

  // Reflect on <html> so Tailwind's `dark:` variants activate, and persist.
  useEffect(() => {
    localStorage.setItem('theme', theme)
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)
  const toggleTheme = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
