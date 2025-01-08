import { usePage } from '@inertiajs/react'

export const useAuth = () => {
    const { props } = usePage()
    return props.auth.user || null
}

export const useHasRole = (roles) => {
    const user = useAuth()

    if (!user || !user.roles) {
        return false
    }

    // Normalize roles to an array if it's a single value
    const roleArray = Array.isArray(roles) ? roles : [roles]

    // Check if user has any of the roles
    return roleArray.some((role) => user.roles.includes(role))
}

export const useHasPermission = (permissions) => {
    const user = useAuth()

    if (!user || !user.permissions) {
        return false
    }

    // Normalize permissions to an array if it's a single value
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions]

    // Check if user has any of the permissions
    return permissionArray.some((permission) => user.permissions.includes(permission))
}
