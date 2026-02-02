import type { Database } from '@/types/database'

export type UserRole = Database['public']['Enums']['user_role']

export const ROLE_PERMISSIONS = {
    admin: {
        canViewAllTickets: true,
        canCreateTickets: true,
        canUpdateTickets: true,
        canCloseTickets: true,
        canManageUsers: true,
        canManageProperties: true,
        canBlockProperties: true,
        canManageProviders: true,
        canViewAnalytics: true,
    },
    sub_director: {
        canViewAllTickets: true,
        canCreateTickets: true,
        canUpdateTickets: false,
        canCloseTickets: false,
        canManageUsers: false,
        canManageProperties: false,
        canBlockProperties: true,
        canManageProviders: false,
        canViewAnalytics: true,
    },
    maintenance: {
        canViewAllTickets: false, // Only assigned
        canCreateTickets: true,
        canUpdateTickets: true, // Only assigned
        canCloseTickets: false,
        canManageUsers: false,
        canManageProperties: false,
        canBlockProperties: false,
        canManageProviders: false,
        canViewAnalytics: false,
    },
    housekeeper: {
        canViewAllTickets: true,
        canCreateTickets: true,
        canUpdateTickets: true,
        canCloseTickets: false,
        canManageUsers: false,
        canManageProperties: false,
        canBlockProperties: false, // Assuming false unless specified
        canManageProviders: false,
        canViewAnalytics: false,
    },
    reporter: {
        canViewAllTickets: false, // Only own
        canCreateTickets: true,
        canUpdateTickets: true, // Only own, limited status
        canCloseTickets: false,
        canManageUsers: false,
        canManageProperties: false,
        canBlockProperties: false,
        canManageProviders: false,
        canViewAnalytics: false,
    },
} as const
