import { useCallback, useEffect, useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item === null ? initialValue : JSON.parse(item)
    } catch (error) {
      console.error(`No se pudo leer la preferencia "${key}" de localStorage.`, error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error(`No se pudo guardar la preferencia "${key}" en localStorage.`, error)
    }
  }, [key, storedValue])

  const setValue = useCallback((value) => {
    setStoredValue((current) => (typeof value === 'function' ? value(current) : value))
  }, [])

  return [storedValue, setValue]
}
