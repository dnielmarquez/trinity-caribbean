import { createClient } from './supabase/server'
import { ROLE_PERMISSIONS, type UserRole } from './role-permissions'

export { ROLE_PERMISSIONS, type UserRole }

/**
 * Get the current user's profile with role
 */
export async function getCurrentUser() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return null
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        return null
    }

    return {
        ...user,
        profile: profile as any, // Type assertion to bypass 'never' inference
    }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
    permission: keyof typeof ROLE_PERMISSIONS.admin
): Promise<boolean> {
    const user = await getCurrentUser()

    if (!user) return false

    const role = (user.profile as any).role as UserRole
    return ROLE_PERMISSIONS[role][permission]
}

/**
 * Require specific permission (throws if not authorized)
 */
export async function requirePermission(
    permission: keyof typeof ROLE_PERMISSIONS.admin
): Promise<void> {
    const allowed = await hasPermission(permission)

    if (!allowed) {
        throw new Error('Unauthorized')
    }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
    const user = await getCurrentUser()
    return (user?.profile as any)?.role === role
}

/**
 * Check if user has one of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
    const user = await getCurrentUser()
    if (!user) return false
    return roles.includes((user.profile as any).role)
}
