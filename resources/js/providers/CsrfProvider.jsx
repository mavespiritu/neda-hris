import React, { createContext, useContext, useEffect } from 'react'
import axios from 'axios'

const CsrfContext = createContext()

export const CsrfProvider = ({ children }) => {
  useEffect(() => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    if (csrfToken) {
      axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken
    }
  }, [])

  return <CsrfContext.Provider value={null}>{children}</CsrfContext.Provider>
}

export const useCsrf = () => useContext(CsrfContext)
