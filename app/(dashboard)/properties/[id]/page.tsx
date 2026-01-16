import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { differenceInHours, subDays } from 'date-fns'
import { calculateAverageResolutionTime } from '@/lib/date-utils'
import type { Database } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type Ticket = Database['public']['Tables']['tickets']['Row']
type Block = Database['public']['Tables']['property_blocks']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface PropertyWithUnits extends Property {
    units: Unit[]
}

interface BlockWithDetails extends Block {
    unit: Pick<Unit, 'name'> | null
    blocked_by_profile: Pick<Profile, 'full_name'>
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function PropertyDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Get property
    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('*, units(*)')
        .eq('id', id)
        .returns<PropertyWithUnits[]>()
        .single()

    if (propError || !property) {
        notFound()
    }

    // Get tickets for this property (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
    const { data: tickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('property_id', id)
        .gte('created_at', thirtyDaysAgo)
        .returns<Ticket[]>()

    // Get current blocks
    const { data: blocks } = await supabase
        .from('property_blocks')
        .select('*, unit:units(name), blocked_by_profile:profiles(full_name)')
        .eq('property_id', id)
        .eq('is_blocked', true)
        .is('unblocked_at', null)
        .returns<BlockWithDetails[]>()

    // Calculate stats
    const openTickets = tickets?.filter((t) => ['reported', 'assigned', 'in_progress'].includes(t.status)).length || 0
    const urgentTickets = tickets?.filter((t) => t.priority === 'urgent').length || 0
    const avgResolutionTime = calculateAverageResolutionTime(tickets || [])

    // Most frequent category
    const categoryCount: Record<string, number> = {}
    tickets?.forEach((t) => {
        categoryCount[t.category] = (categoryCount[t.category] || 0) + 1
    })
    const mostFrequentCategory = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0]

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {property.name}
                </h1>
                {property.address && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{property.address}</p>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Tickets</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{openTickets}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Urgent</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{urgentTickets}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Resolution</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{avgResolutionTime}h</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total (30d)</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{tickets?.length || 0}</p>
                </div>
            </div>

            {/* Most Frequent Category */}
            {mostFrequentCategory && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Most Frequent Issue
                    </h3>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                        {mostFrequentCategory.replace('_', ' ')} ({categoryCount[mostFrequentCategory]} tickets)
                    </p>
                </div>
            )}

            {/* Blocked Units */}
            {blocks && blocks.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4">
                        🚫 Blocked Units ({blocks.length})
                    </h3>
                    <div className="space-y-3">
                        {blocks.map((block) => {
                            const duration = differenceInHours(new Date(), new Date(block.blocked_at))
                            return (
                                <div key={block.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {block.unit?.name || 'Entire Property'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {block.reason}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                Blocked by {block.blocked_by_profile?.full_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-red-600">
                                                {Math.floor(duration / 24)}d {duration % 24}h
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Units List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Units ({property.units?.length || 0})
                    </h2>
                </div>
                <div className="p-6">
                    {property.units && property.units.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {property.units.map((unit) => (
                                <div
                                    key={unit.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                >
                                    <p className="font-medium text-gray-900 dark:text-white">{unit.name}</p>
                                    {unit.notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{unit.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400">No units defined</p>
                    )}
                </div>
            </div>
        </div>
    )
}
