'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient as createAdminClient } from '@/lib/supabase/service'
import { getCurrentUser } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Ticket = Database['public']['Tables']['tickets']['Row']
type Property = Database['public']['Tables']['properties']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type TicketUpdate = Database['public']['Tables']['tickets']['Update']
type TicketStatus = Database['public']['Enums']['ticket_status']


export interface TicketWithDetails extends Ticket {
    property: Property
    unit: Unit | null
    assigned_to: Pick<Profile, 'id' | 'full_name'> | null
    created_by_profile: Pick<Profile, 'id' | 'full_name'> | null
}

export interface TicketFilters {
    search?: string
    property_id?: string[]
    unit_id?: string
    category?: string[]
    priority?: string[]
    status?: string[]
    assigned_to?: string[]
    urgent_only?: boolean
    type?: ('corrective' | 'preventive')[]
}

/**
 * Get paginated and filtered tickets based on user role
 */
export async function getTickets(filters: TicketFilters = {}, page = 1, pageSize = 20) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { data: null, error: 'Not authenticated' }
    }

    // Default to only corrective tickets if not specified
    // But allow empty array to mean "all" if explicitly desired, though typically we want default behavior.
    // For now, let's say if filters.type is undefined, we show corrective.
    // If user wants all, they can pass both.
    const typeFilter = filters.type || ['corrective']

    let query = supabase
        .from('tickets')
        .select(`
      *,
      property:properties(*),
      unit:units(*),
      assigned_to:profiles!tickets_assigned_to_user_id_fkey(id, full_name),
      created_by_profile:profiles!tickets_created_by_fkey(id, full_name)
    `, { count: 'exact' })
        .in('type', typeFilter)

    // Apply filters
    if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,property.name.ilike.%${filters.search}%`)
    }

    if (filters.property_id?.length) {
        query = query.in('property_id', filters.property_id)
    }

    if (filters.unit_id) {
        query = query.eq('unit_id', filters.unit_id)
    }

    if (filters.category?.length) {
        query = query.in('category', filters.category)
    }

    if (filters.priority?.length) {
        query = query.in('priority', filters.priority)
    }

    if (filters.status?.length) {
        query = query.in('status', filters.status)
    }

    if (filters.assigned_to?.length) {
        query = query.in('assigned_to_user_id', filters.assigned_to)
    }

    if (filters.urgent_only) {
        query = query.eq('priority', 'urgent')
    }

    // Note: RLS policies will automatically filter based on role
    // Admin/Sub Director: see all
    // Maintenance: see assigned
    // Reporter: see own

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)
        .returns<TicketWithDetails[]>()

    if (error) {
        console.error('Error fetching tickets:', error)
        return { data: null, error: error.message }
    }

    return {
        data: data || [],
        count: count || 0,
        page,
        limit: pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
    }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data, error } = await (supabase
        .from('tickets') as any)
        .update({ status })
        .eq('id', ticketId)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    const { error: auditError } = await (supabase.from('ticket_audit_logs') as any).insert({
        ticket_id: ticketId,
        actor_id: user.id,
        action: 'status_changed',
        from_value: null, // TODO: Get old value
        to_value: { status },
    })

    if (auditError) {
        console.error('Error inserting audit log (status):', auditError)
    }

    revalidatePath('/dashboard')
    revalidatePath(`/tickets/${ticketId}`)

    return { data }
}

/**
 * Assign ticket to a user
 */
export async function assignTicket(ticketId: string, userId: string | null) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }


    const status: TicketStatus = userId ? 'assigned' : 'reported'

    const updates: TicketUpdate = {
        assigned_to_user_id: userId,
        status,
    }

    const { data, error } = await (supabase
        .from('tickets') as any)
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    // Get assignee name for audit log
    let assigneeName = 'Unknown'
    if (userId) {
        const { data: assignee } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
        if (assignee) assigneeName = (assignee as any).full_name
    }

    const { error: auditError } = await (supabase.from('ticket_audit_logs') as any).insert({
        ticket_id: ticketId,
        actor_id: user.id,
        action: 'assigned',
        from_value: null,
        to_value: { assigned_to_user_id: userId, assigned_to_name: assigneeName },
    })

    if (auditError) {
        console.error('Error inserting audit log (assignment):', auditError)
    }

    revalidatePath('/dashboard')
    revalidatePath(`/tickets/${ticketId}`)

    // Webhook Notification
    if (userId) {
        // We fire and forget this to not block the UI response, 
        // but since Vercel/Serverless lambda functions might freeze execution after response,
        // it is safer to await it or use `waitUntil` (if available in Next.js/platform).
        // For standard server actions, awaiting is safer to ensure delivery.
        try {
            // Fetch assignee for telegram id
            const { data: assignee } = await (supabase
                .from('profiles') as any)
                .select('telegram_chat_id')
                .eq('id', userId)
                .single()

            if (assignee?.telegram_chat_id) {
                // Fetch ticket details if not available (we only have ID)
                // We deliberately fetch fresh data to be accurate
                const { data: ticket } = await (supabase
                    .from('tickets') as any)
                    .select('category, description, priority')
                    .eq('id', ticketId)
                    .single()


                if (ticket) {
                    let subDirectorChatId: string | undefined

                    if (ticket.priority === 'urgent') {
                        const { data: subDirector } = await (supabase
                            .from('profiles') as any)
                            .select('telegram_chat_id')
                            .eq('role', 'sub_director')
                            .limit(1)
                            .single()

                        if (subDirector?.telegram_chat_id) {
                            subDirectorChatId = subDirector.telegram_chat_id
                        }
                    }

                    const payload = {
                        ticket_id: ticketId,
                        assigned_by: (user as any).profile?.full_name || 'System',
                        category: ticket.category,
                        description: ticket.description,
                        user_telegram_chat_id: assignee.telegram_chat_id,
                        user_id: userId,
                        priority: ticket.priority
                    }

                    const webhookUrl = process.env.N8N_TICKET_ASSIGNED_WEBHOOK_URL
                    if (webhookUrl) {
                        await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        })
                    } else {
                        console.warn('N8N_TICKET_ASSIGNED_WEBHOOK_URL is not set')
                    }
                }
            }
        } catch (err) {
            console.error('Failed to trigger assignment  webhook:', err)
            // We ignore webhook errors to not fail the assignment itself
        }
    }

    return { data }
}

/**
 * Add a quick note (comment) to a ticket
 */
export async function addQuickNote(ticketId: string, note: string) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data, error } = await (supabase
        .from('ticket_comments') as any)
        .insert({
            ticket_id: ticketId,
            author_id: user.id,
            body: note,
        })
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    // Audit Log for Comment
    const { error: auditError } = await (supabase.from('ticket_audit_logs') as any).insert({
        ticket_id: ticketId,
        actor_id: user.id,
        action: 'comment_added',
        from_value: null,
        to_value: { body: note },
    })

    if (auditError) {
        console.error('Error inserting audit log (comment):', auditError)
    }

    revalidatePath('/dashboard')
    revalidatePath(`/tickets/${ticketId}`)

    return { data }
}

/**
 * Update any ticket fields (Admin/Sub-Director)
 */
export async function updateTicket(ticketId: string, updates: TicketUpdate) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Capture old values for audit log
    const { data: oldTicketData } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single()

    const oldTicket = oldTicketData as Ticket | null

    // Automate status transition: reported -> assigned when assigned_to_user_id is set
    let finalUpdates = { ...updates }
    if (updates.assigned_to_user_id && oldTicket?.status === 'reported' && !updates.status) {
        finalUpdates.status = 'assigned'
    }

    const { data, error } = await (supabase
        .from('tickets') as any)
        .update(finalUpdates)
        .eq('id', ticketId)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    // Create audit logs for changed fields
    const actions: string[] = []
    if (finalUpdates.status && finalUpdates.status !== oldTicket?.status) actions.push('status_changed')
    if (finalUpdates.priority && finalUpdates.priority !== oldTicket?.priority) actions.push('priority_changed')
    if (finalUpdates.assigned_to_user_id !== undefined && finalUpdates.assigned_to_user_id !== oldTicket?.assigned_to_user_id) {
        actions.push('assigned_to_changed')
    }
    if (finalUpdates.category && finalUpdates.category !== oldTicket?.category) actions.push('category_changed')
    if (finalUpdates.description && finalUpdates.description !== oldTicket?.description) actions.push('description_changed')

    if (actions.length > 0) {
        // enrich finalUpdates with assignee name if assigned_to_changed
        if (actions.includes('assigned_to_changed') && finalUpdates.assigned_to_user_id) {
            const { data: assignee } = await supabase.from('profiles').select('full_name').eq('id', finalUpdates.assigned_to_user_id).single()
            if (assignee) {
                (finalUpdates as any).assigned_to_name = (assignee as any).full_name
            }
        }

        const { error: auditError } = await (supabase.from('ticket_audit_logs') as any).insert({
            ticket_id: ticketId,
            actor_id: user.id,
            action: actions.join(', '),
            from_value: oldTicket,
            to_value: finalUpdates,
        })

        if (auditError) {
            console.error('Error inserting audit log (update):', auditError)
        }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/tickets/${ticketId}`)

    return { data }
}

/**
 * Delete a ticket
 */
export async function deleteTicket(ticketId: string) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/tickets')

    return { success: true }
}
