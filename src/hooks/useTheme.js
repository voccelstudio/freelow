import { useState, useEffect } from 'react'
import { getCfg, setCfg } from '../lib/db'
import { applyTheme } from '../lib/themes'

export function useTheme() {
  const [theme, setThemeState] = useState('minimal')

  useEffect(() => {
    getCfg('tema', 'minimal').then(t => {
      const val = t || 'minimal'
      setThemeState(val)
      applyTheme(val)
    })
  }, [])

  async function setTheme(name) {
    applyTheme(name)
    setThemeState(name)
    await setCfg('tema', name)
  }

  return { theme, setTheme }
}
