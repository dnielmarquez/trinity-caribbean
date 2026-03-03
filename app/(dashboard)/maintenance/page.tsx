import { getCurrentUser } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCategoryConfig } from '@/lib/categories'
import { calculateTicketAge } from '@/lib/date-utils'
import { StatusBadge } from '@/components/tickets/status-badge'
import { PriorityBadge } from '@/components/tickets/priority-badge'
import { CleaningLogoutButton } from '@/components/cleaning/cleaning-logout-button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function MaintenancePage() {
    const user = await getCurrentUser()

    if (!user) redirect('/login')

    // Basic RBAC check
    if (user.profile.role !== 'maintenance' && user.profile.role !== 'admin' && user.profile.role !== 'sub_director') {
        redirect('/dashboard')
    }

    const supabase = await createClient()

    // Fetch ONLY tickets assigned to this maintenance user that are NOT resolved or closed
    // (We also fetch property and unit details for display)
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
            id,
            description,
            priority,
            status,
            category,
            created_at,
            property:properties(name),
            unit:units(name)
        `)
        .eq('assigned_to_user_id', user.id)
        .in('status', ['reported', 'assigned', 'in_progress']) // Only show active tickets
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .returns<any[]>()

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    Error loading tasks: {error.message}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            <div className="max-w-md mx-auto p-4 pt-6 space-y-4">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            My Tasks
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                            Tickets currently assigned to you.
                        </p>
                    </div>
                    <CleaningLogoutButton />
                </div>

                {(!tickets || tickets.length === 0) ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-medium mb-1">All caught up!</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">You have no active tasks assigned right now.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => {
                            const categoryConfig = getCategoryConfig(ticket.category as any)
                            const CategoryIcon = categoryConfig.icon
                            const age = calculateTicketAge(ticket.created_at)

                            // Render out mobile-friendly task cards
                            return (
                                <Link href={`/tickets/${ticket.id}`} key={ticket.id} className="block group">
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-shadow group-hover:shadow-md">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-2 rounded-lg ${categoryConfig.color.replace('text-', 'bg-').replace('600', '100')} dark:bg-opacity-20`}>
                                                    <CategoryIcon className={`w-5 h-5 ${categoryConfig.color}`} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                                        {(ticket.property as any)?.name}
                                                    </div>
                                                    {(ticket.unit as any)?.name && (
                                                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                                                            {(ticket.unit as any).name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <StatusBadge status={ticket.status as any} />
                                        </div>

                                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                                            {ticket.description}
                                        </p>

                                        <div className="flex justify-between items-center">
                                            <PriorityBadge priority={ticket.priority as any} />
                                            <span className={`text-xs ${age.isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {age.label}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Floating Action Button (FAB) for creating a new ticket */}
            <Link
                href="/tickets/new"
                className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
            >
                <Plus className="w-6 h-6" />
            </Link>
        </div>
    )
}
