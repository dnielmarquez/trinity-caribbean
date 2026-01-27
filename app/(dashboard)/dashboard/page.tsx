import { getTickets } from '@/actions/tickets'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { StatusBadge } from '@/components/tickets/status-badge'
import { PriorityBadge } from '@/components/tickets/priority-badge'
import { getCategoryConfig } from '@/lib/categories'
import { calculateTicketAge } from '@/lib/date-utils'

interface DashboardPageProps {
    searchParams: Promise<{
        property_id?: string
    }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const params = await searchParams
    // Dashboard shows only Urgent tickets, respecting property context
    const response = await getTickets({
        property_id: params.property_id ? [params.property_id] : undefined,
        priority: ['urgent']
    }, 1, 50)

    if (response.error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    Error loading tickets: {response.error}
                </div>
            </div>
        )
    }

    const tickets = response.data || []

    const stats = {
        total: tickets.length,
        urgent: tickets.filter((t) => t.priority === 'urgent').length,
        open: tickets.filter((t) => ['reported', 'assigned', 'in_progress'].includes(t.status)).length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        Dashboard
                    </h1>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Manage maintenance tickets and requests
                    </p>
                </div>
                <Link href="/tickets/new" className="w-full md:w-auto">
                    <Button size="lg" className="w-full md:w-auto">
                        <Plus className="w-5 h-5 mr-2" />
                        New Ticket
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Urgent</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.urgent}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{stats.open}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.resolved}</p>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tickets</h2>
                </div>

                {tickets.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        No tickets found. Create your first ticket to get started.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Property / Unit
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Priority
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Assigned To
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Age
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {tickets.map((ticket) => {
                                    const categoryConfig = getCategoryConfig(ticket.category)
                                    const CategoryIcon = categoryConfig.icon
                                    const age = calculateTicketAge(ticket.created_at)

                                    return (
                                        <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {ticket.property?.name || 'Unknown'}
                                                </div>
                                                {ticket.unit && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {ticket.unit.name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <CategoryIcon className={`w-5 h-5 mr-2 ${categoryConfig.color}`} />
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        {categoryConfig.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-white line-clamp-2">
                                                    {ticket.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <PriorityBadge priority={ticket.priority} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={ticket.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {ticket.assigned_to?.full_name || (
                                                        <span className="text-gray-500 italic">Unassigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm ${age.isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {age.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link href={`/tickets/${ticket.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        View
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
