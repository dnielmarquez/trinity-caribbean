import { getCurrentUser, hasPermission } from '@/lib/rbac'
import { getCategoryConfig } from '@/lib/categories'
import { formatDate, calculateTicketAge } from '@/lib/date-utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Eye } from 'lucide-react'
import { getTickets } from '@/actions/tickets'
import { getProperties } from '@/actions/properties'
import { TicketFilterBar } from '@/components/tickets/ticket-filter-bar'
import { TicketEditButton } from '@/components/tickets/ticket-edit-button'
import { InlineStatusSelect } from '@/components/tickets/inline-status-select'
import { InlinePrioritySelect } from '@/components/tickets/inline-priority-select'
import { InlineAssigneeSelect } from '@/components/tickets/inline-assignee-select'
import { DeleteTicketButton } from '@/components/tickets/delete-ticket-button'
import { createClient } from '@/lib/supabase/server'

interface TicketsPageProps {
    searchParams: Promise<{
        search?: string
        property_id?: string
        category?: string
        status?: string
        priority?: string
        assigned_to?: string
        page?: string
    }>
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
    const params = await searchParams
    const user = await getCurrentUser()
    const canEdit = await hasPermission('canUpdateTickets')
    const supabase = await createClient()

    const splitParam = (param: string | string[] | undefined) => {
        if (!param) return undefined
        if (Array.isArray(param)) return param
        return param.split(',').filter(Boolean)
    }

    const filters = {
        search: typeof params.search === 'string' ? params.search : undefined,
        property_id: splitParam(params.property_id),
        category: splitParam(params.category),
        status: splitParam(params.status),
        priority: splitParam(params.priority),
        assigned_to: splitParam(params.assigned_to),
    }

    const page = params.page ? parseInt(params.page) : 1

    // Fetch tickets using server action
    const { data: tickets, count, totalPages } = await getTickets(filters, page)

    // Fetch properties for the filter bar
    const { data: properties } = await getProperties()

    // Fetch staff list for the edit button and inline assign
    const { data: staff } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['maintenance', 'admin', 'sub_director'])
        .order('full_name')

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Tickets
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {count ?? 0} tickets found
                    </p>
                </div>
                <Link href="/tickets/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Ticket
                    </Button>
                </Link>
            </div>

            {/* Filter Bar */}
            <TicketFilterBar properties={properties || []} staff={staff || []} />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Ticket
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Property
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Assigned To
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {tickets && tickets.length > 0 ? (
                                tickets.map((ticket) => {
                                    const categoryConfig = getCategoryConfig(ticket.category)
                                    const CategoryIcon = categoryConfig.icon
                                    const age = calculateTicketAge(ticket.created_at)

                                    return (
                                        <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-start gap-3 max-w-[320px]">
                                                    <div className={`p-2 rounded-lg ${categoryConfig.color.replace('text-', 'bg-').replace('600', '100')} dark:bg-gray-700`}>
                                                        <CategoryIcon className={`w-5 h-5 ${categoryConfig.color}`} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1 break-all">
                                                            {ticket.description}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            {categoryConfig.label}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {ticket.property?.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {ticket.unit?.name || 'Common Area'}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <InlineAssigneeSelect
                                                    ticketId={ticket.id}
                                                    assignedTo={ticket.assigned_to}
                                                    staff={(staff || []) as any}
                                                    canEdit={canEdit}
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <InlineStatusSelect
                                                    ticketId={ticket.id}
                                                    status={ticket.status}
                                                    canEdit={canEdit}
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <InlinePrioritySelect
                                                    ticketId={ticket.id}
                                                    priority={ticket.priority}
                                                    canEdit={canEdit}
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm ${age.isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900 dark:text-white'}`}>
                                                        {age.label} ago
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(ticket.created_at)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/tickets/${ticket.id}`} title="View Ticket">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Eye className="w-4 h-4" />
                                                            <span className="sr-only">View</span>
                                                        </Button>
                                                    </Link>
                                                    {canEdit && staff && (
                                                        <TicketEditButton
                                                            ticket={ticket}
                                                            staff={staff as any}
                                                        />
                                                    )}
                                                    {canEdit && (
                                                        <DeleteTicketButton ticketId={ticket.id} />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                        No tickets found. Try adjusting your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination placeholder - can be implemented later if needed */}
            {totalPages && totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                </div>
            )}
        </div>
    )
}
