import { useState, useCallback, useEffect, useRef } from 'react'

let _showToast = null

export function toast(msg, tipo = 'ok') {
  _showToast?.(msg, tipo)
}

export function ToastProvider() {
  const [state, setState] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    _showToast = (msg, tipo) => {
      clearTimeout(timer.current)
      setState({ msg, tipo })
      timer.current = setTimeout(() => setState(null), 3200)
    }
    return () => { _showToast = null }
  }, [])

  if (!state) return null

  return (
    <div className={`toast toast-${state.tipo}`} style={{ opacity: 1, transform: 'translateY(0)' }}>
      {state.msg}
    </div>
  )
}
