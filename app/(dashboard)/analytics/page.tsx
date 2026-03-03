import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import AnalyticsClient from './analytics-client'
import { ROLE_PERMISSIONS } from '@/lib/role-permissions'

export default async function AnalyticsPage(props: { searchParams: Promise<{ property_id?: string; from?: string; to?: string }> }) {
    const searchParams = await props.searchParams
    const propertyId = searchParams.property_id || 'all'
    const fromDate = searchParams.from
    const toDate = searchParams.to

    const user = await getCurrentUser()
    if (!user) {
        redirect('/login')
    }

    const permissions = ROLE_PERMISSIONS[user.profile.role as keyof typeof ROLE_PERMISSIONS]
    if (!permissions.canViewAnalytics) {
        redirect('/dashboard') // Or some unauthorized page
    }

    const supabase = await createClient()

    // 1. Fetch active blocks (Blockage Monitor)
    let blocksQuery = supabase
        .from('active_blocks')
        .select('*')

    if (propertyId !== 'all') {
        blocksQuery = blocksQuery.eq('property_id', propertyId)
    }

    const { data: dbBlocks } = await blocksQuery

    // 1.5 Fetch critical tickets that act as blockages
    let criticalTicketsQuery = supabase
        .from('tickets')
        .select(`
            id,
            category,
            created_at,
            property_id,
            unit_id,
            assigned_to:profiles!tickets_assigned_to_user_id_fkey(full_name),
            properties ( name ),
            units ( name )
        `)
        .in('category', ['ac', 'plumbing', 'wifi'])
        .not('status', 'in', '("resolved","closed")')

    if (propertyId !== 'all') {
        criticalTicketsQuery = criticalTicketsQuery.eq('property_id', propertyId)
    }

    const { data: criticalTickets } = await criticalTicketsQuery

    // Map critical tickets to match the block shape
    const ticketBlocks = (criticalTickets || []).map((t: any) => {
        const diffMs = Math.abs(new Date().getTime() - new Date(t.created_at).getTime())
        const diffHrs = diffMs / (1000 * 60 * 60)
        return {
            id: t.id,
            property_id: t.property_id,
            unit_id: t.unit_id,
            property_name: t.properties?.name || 'Unknown Property',
            unit_name: t.units?.name,
            reason: `Maintenance: ${t.category.toUpperCase()}`,
            blocked_by_name: t.assigned_to?.full_name || 'Unassigned',
            blocked_duration_hours: diffHrs
        }
    })

    const activeBlocks = [...(dbBlocks || []), ...ticketBlocks]

    // 2. Fetch Tickets for the current month for (Spending, Resolution, Compliance, Charts)
    let ticketsQuery = supabase
        .from('tickets')
        .select(`
            *,
            ticket_expenses ( amount )
        `)

    if (fromDate) {
        ticketsQuery = ticketsQuery.gte('created_at', fromDate)
    }
    if (toDate) {
        // Adjust to end of day if it's just a date string
        const parsedTo = new Date(toDate)
        parsedTo.setHours(23, 59, 59, 999)
        ticketsQuery = ticketsQuery.lte('created_at', parsedTo.toISOString())
    }

    if (propertyId !== 'all') {
        ticketsQuery = ticketsQuery.eq('property_id', propertyId)
    }

    const { data: tickets } = await ticketsQuery

    // 3. Fetch all profiles for Employee Performance
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role')

    // Prepare data for the client component
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Overview</h1>
            </div>

            <AnalyticsClient
                tickets={tickets || []}
                activeBlocks={activeBlocks || []}
                profiles={profiles || []}
            />
        </div>
    )
}
