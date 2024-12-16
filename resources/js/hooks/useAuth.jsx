import { usePage } from '@inertiajs/react'

export const useAuth = () => {
    const { props } = usePage()
    return props.auth.user || null
}

export const useHasRole = (role) => {
    const user = useAuth()

    if (!user || !user.roles) {
        return false
    }

    return user.roles.includes(role)
}

export const useHasPermission = (permission) => {
    const user = useAuth()

    if (!user || !user.permissions) {
        return false
    }

    return user.permissions.includes(permission)
}