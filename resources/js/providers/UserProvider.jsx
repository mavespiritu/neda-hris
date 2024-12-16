import {useState, useEffect, createContext, useContext} from 'react'
import { usePage } from '@inertiajs/react'

const UserContext = createContext()

export const useUser = () => useContext(UserContext)

export const UserProvider = ({children}) => {
    const { auth } = usePage().props

    const [user, setUser] = useState(null)

    useEffect(() => {
        if (auth.user) {
          setUser(auth.user)
        }
      }, [auth.user])

    const value = { user, setUser }

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    )
}

export default UserProvider