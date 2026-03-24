import { useState, useEffect, useCallback } from 'react'
import { getAll, getOne, put, del, byIdx, getCfg, setCfg } from '../lib/db'

// Generic hook: load all records from a store, refetch on demand
export function useStore(storeName) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const rows = await getAll(storeName)
    setData(rows)
    setLoading(false)
  }, [storeName])

  useEffect(() => { reload() }, [reload])

  return { data, loading, reload }
}

// Hook for a single config value
export function useCfg(key, defaultValue = null) {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    getCfg(key, defaultValue).then(v => setValue(v ?? defaultValue))
  }, [key, defaultValue])

  const save = useCallback(async (newVal) => {
    await setCfg(key, newVal)
    setValue(newVal)
  }, [key])

  return [value, save]
}

export { getAll, getOne, put, del, byIdx, getCfg, setCfg }
