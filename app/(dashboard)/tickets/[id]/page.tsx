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
import { CommentItem } from '@/components/tickets/comment-item'
import { TimelineItem } from '@/components/tickets/timeline-item'
import { TicketExpenses } from '@/components/tickets/ticket-expenses'
import { TicketCommentForm } from '@/components/tickets/ticket-comment-form'

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

// Helper to create a timeline item from ticket data
const createLogFromEvent = (
    action: string,
    date: string,
    actor?: Pick<Profile, 'full_name' | 'role'> | null,
    details?: any
): LogWithActor => ({
    id: `virtual-${action}-${date}`,
    ticket_id: '',
    actor_id: '',
    action,
    from_value: null,
    to_value: details || null,
    created_at: date,
    actor: actor || null,
})

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



    const categoryConfig = getCategoryConfig(ticket.category)
    const CategoryIcon = categoryConfig.icon
    const age = calculateTicketAge(ticket.created_at)

    // Construct Unified Timeline
    const timelineEvents: LogWithActor[] = [...(auditLogs || [])]

    // Ensure "Created" event exists
    const hasCreatedLog = timelineEvents.some(l => l.action === 'created')
    if (!hasCreatedLog) {
        timelineEvents.push(createLogFromEvent(
            'created',
            ticket.created_at,
            ticket.created_by_profile
        ))
    }

    // Ensure "Resolved" event exists if applicable
    if (ticket.resolved_at) {
        // Check if we already have a status change to 'resolved' around that time? 
        // Or just blindly add it if missing? 
        // The audit log for status change might be there, but explicit "resolved" marker is nice.
        // Actually, status_change to 'resolved' should cover it. 
        // But if legacy data, might be missing.
        // Let's rely on audit logs for status changes, but if we want to be safe:
        // formatting logic in TimelineItem handles 'status_changed'.
        // Let's leave it to audit logs for now, unless missing.
    }

    // Sort descending
    timelineEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
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
                                    <CommentItem key={comment.id} comment={comment} />
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
                            )}
                        </div>
                        <TicketCommentForm ticketId={id} />
                    </div>

                    {/* Audit Timeline */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Timeline
                        </h2>
                        <div className="space-y-4">
                            {timelineEvents.length > 0 ? (
                                timelineEvents.map((log) => (
                                    <TimelineItem key={log.id} log={log} />
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
                        {ticket.assigned_to ? (
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
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <User className="w-4 h-4" />
                                    <span>Assigned to</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Unassigned
                                </p>
                            </div>
                        )}
                        {/* Dates removed as they are now in the timeline */}
                    </div>

                    {/* Costs */}
                    <TicketExpenses ticketId={id} isEditable={canEdit} />
                </div>
            </div>
        </div>
    )
}
