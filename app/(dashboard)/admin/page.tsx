import { getCurrentUser, hasPermission } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { AdminTabs } from '@/components/admin/admin-tabs'

type Profile = Database['public']['Tables']['profiles']['Row']
type Property = Database['public']['Tables']['properties']['Row']
type Unit = Database['public']['Tables']['units']['Row'] & {
    property?: { name: string } | null
}

export default async function AdminPage() {
    const user = await getCurrentUser()
    const canManageUsers = await hasPermission('canManageUsers')

    if (!canManageUsers) {
        redirect('/dashboard')
    }

    const supabase = await createClient()

    // Get all users
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<Profile[]>()

    // Get properties
    const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .order('name')
        .returns<Property[]>()

    // Get units with property names
    const { data: units } = await supabase
        .from('units')
        .select('*, property:properties(name)')
        .order('name')
        .returns<Unit[]>()

    // Get counts
    const { count: ticketsCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Admin Panel
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    System management and configuration
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {profiles?.length || 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {ticketsCount || 0}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Properties</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                        {properties?.length || 0}
                    </p>
                </div>
            </div>

            {/* Tabs for different management sections */}
            <AdminTabs
                profiles={profiles || []}
                properties={properties || []}
                units={units || []}
            />
        </div>
    )
}
