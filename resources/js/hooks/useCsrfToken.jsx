import { useEffect } from 'react'
import axios from 'axios'

const useCsrfToken = () => {
  useEffect(() => {
    // Get the CSRF token from the meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    
    // If the CSRF token exists, set it as the default header for Axios
    if (csrfToken) {
      axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken
    } else {
      console.error('CSRF token not found')
    }
  }, []) // Empty dependency array to run only once on mount
}

export default useCsrfToken