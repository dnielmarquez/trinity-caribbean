import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StatusBadge } from '@/components/tickets/status-badge'
import { PriorityBadge } from '@/components/tickets/priority-badge'
import { getCategoryConfig } from '@/lib/categories'
import { calculateTicketAge, formatDate } from '@/lib/date-utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, DollarSign } from 'lucide-react'
import type { Database } from '@/types/database'
import { TicketEditButton } from '@/components/tickets/ticket-edit-button'
import { getCurrentUser, hasPermission } from '@/lib/rbac'

type Ticket = Database['public']['Tables']['tickets']['Row']
type Property = Database['public']['Tables']['properties']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Comment = Database['public']['Tables']['ticket_comments']['Row']
type Attachment = Database['public']['Tables']['ticket_attachments']['Row']
type AuditLog = Database['public']['Tables']['ticket_audit_logs']['Row']
type TicketCost = Database['public']['Tables']['ticket_costs']['Row']

interface TicketWithDetails extends Ticket {
    property: Property
    unit: Unit | null
    assigned_to: Pick<Profile, 'id' | 'full_name' | 'role'> | null
    created_by_profile: Pick<Profile, 'id' | 'full_name' | 'role'>
}

interface CommentWithAuthor extends Comment {
    author: Pick<Profile, 'full_name' | 'role'>
}

interface LogWithActor extends AuditLog {
    actor: Pick<Profile, 'full_name' | 'role'> | null
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const user = await getCurrentUser()
    const canEdit = await hasPermission('canUpdateTickets')

    const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
      *,
      property:properties(*),
      unit:units(*),
      assigned_to:profiles!tickets_assigned_to_user_id_fkey(id, full_name, role),
      created_by_profile:profiles!tickets_created_by_fkey(id, full_name, role)
    `)
        .eq('id', id)
        .returns<TicketWithDetails[]>()
        .single()

    if (error || !ticket) {
        notFound()
    }

    // Get staff members for assignment (maintenance, admin, sub_director)
    const { data: staff } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['maintenance', 'admin', 'sub_director'])
        .order('full_name')
        .returns<Pick<Profile, 'id' | 'full_name' | 'role'>[]>()

    // Get attachments... (same as before)

    // Get attachments
    const { data: attachments } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: false })
        .returns<Attachment[]>()

    // Get comments
    const { data: comments } = await supabase
        .from('ticket_comments')
        .select(`
      *,
      author:profiles(full_name, role)
    `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })
        .returns<CommentWithAuthor[]>()

    // Get audit logs
    const { data: auditLogs } = await supabase
        .from('ticket_audit_logs')
        .select(`
      *,
      actor:profiles(full_name, role)
    `)
        .eq('ticket_id', id)
        .order('created_at', { ascending: false })
        .returns<LogWithActor[]>()

    // Get costs
    const { data: costs } = await supabase
        .from('ticket_costs')
        .select('*')
        .eq('ticket_id', id)
        .returns<TicketCost[]>()
        .single()

    const categoryConfig = getCategoryConfig(ticket.category)
    const CategoryIcon = categoryConfig.icon
    const age = calculateTicketAge(ticket.created_at)

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-3">
                            <CategoryIcon className={`w-6 h-6 ${categoryConfig.color}`} />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {categoryConfig.label} - {ticket.property?.name}
                            </h1>
                        </div>
                        {canEdit && <TicketEditButton ticket={ticket} staff={staff || []} />}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {ticket.unit?.name}
                        </span>
                        <span className={`text-sm ${age.isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            Created {age.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Description
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {ticket.description}
                        </p>
                        {ticket.requires_spend && (
                            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                                    💰 This ticket may require spending/purchases
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Attachments */}
                    {attachments && attachments.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Evidence ({attachments.length})
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {attachments.map((attachment) => (
                                    <div key={attachment.id} className="relative group">
                                        {attachment.kind === 'image' ? (
                                            <img
                                                src={attachment.url}
                                                alt="Evidence"
                                                className="rounded-lg w-full h-32 object-cover"
                                            />
                                        ) : (
                                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg w-full h-32 flex items-center justify-center">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {attachment.kind}
                                                </span>
                                            </div>
                                        )}
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-sm font-medium"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Comments ({comments?.length || 0})
                        </h2>
                        <div className="space-y-4">
                            {comments && comments.length > 0 ? (
                                comments.map((comment) => (
                                    <div key={comment.id} className="border-l-2 border-blue-500 pl-4 py-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {comment.author?.full_name}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(comment.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {comment.body}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
                            )}
                        </div>
                    </div>

                    {/* Audit Timeline */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Timeline
                        </h2>
                        <div className="space-y-4">
                            {auditLogs && auditLogs.length > 0 ? (
                                auditLogs.map((log) => (
                                    <div key={log.id} className="flex gap-4">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {log.actor?.full_name}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {log.action.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(log.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Metadata */}
                <div className="space-y-6">
                    {/* Info Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span>Created</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(ticket.created_at)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                by {ticket.created_by_profile?.full_name}
                            </p>
                        </div>

                        {ticket.assigned_to && (
                            <div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <User className="w-4 h-4" />
                                    <span>Assigned to</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {ticket.assigned_to.full_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                    {ticket.assigned_to.role}
                                </p>
                            </div>
                        )}

                        {ticket.resolved_at && (
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    Resolved
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatDate(ticket.resolved_at)}
                                </p>
                            </div>
                        )}

                        {ticket.closed_at && (
                            <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    Closed
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {formatDate(ticket.closed_at)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Costs */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Costs
                            </h3>
                        </div>
                        {costs ? (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Labor</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        ${costs.labor_amount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Parts</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        ${costs.parts_amount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                                    <div className="flex justify-between font-semibold">
                                        <span className="text-gray-900 dark:text-white">Total</span>
                                        <span className="text-green-600">
                                            ${costs.total_amount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No costs recorded yet
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
