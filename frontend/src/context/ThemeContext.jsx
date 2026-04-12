import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('snapzy_theme') === 'dark'
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dp')
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.style.colorScheme = 'dark'
      localStorage.setItem('snapzy_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dp')
      document.documentElement.setAttribute('data-theme', 'light')
      document.documentElement.style.colorScheme = 'light'
      localStorage.setItem('snapzy_theme', 'light')
    }
  }, [isDark])

  const toggle = (e) => {
    // Ripple animation from click point
    if (e) {
      const ripple = document.createElement('div')
      ripple.className = 'theme-ripple'
      const x = e.clientX ?? window.innerWidth / 2
      const y = e.clientY ?? window.innerHeight / 2
      ripple.style.left = x + 'px'
      ripple.style.top = y + 'px'
      document.body.appendChild(ripple)

      // Purple bubbles
      for (let i = 0; i < 8; i++) {
        const bubble = document.createElement('div')
        bubble.className = 'theme-bubble'
        bubble.style.left = (x + (Math.random() - 0.5) * 60) + 'px'
        bubble.style.top = (y + (Math.random() - 0.5) * 60) + 'px'
        bubble.style.width = (8 + Math.random() * 14) + 'px'
        bubble.style.height = bubble.style.width
        bubble.style.animationDelay = (Math.random() * 0.3) + 's'
        document.body.appendChild(bubble)
        setTimeout(() => bubble.remove(), 1200)
      }

      setTimeout(() => ripple.remove(), 900)
    }
    setIsDark(d => !d)
  }

  return (
    <ThemeContext.Provider value={{ theme: isDark ? 'dark' : 'light', toggle, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}
