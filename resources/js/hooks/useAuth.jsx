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

export const useCanViewResource = (resource, options = {}) => {
    const user = useAuth()
    const userRoles = usePage().props.auth?.roles || []

    // HR or other allowed roles can view all
    if (options.allowedRoles && userRoles.some(role => options.allowedRoles.includes(role))) {
        return true
    }

    // Check division-based access
    if (options.divisionKey && resource[options.divisionKey]) {
        return user?.division === resource[options.divisionKey]
    }

    return false
}