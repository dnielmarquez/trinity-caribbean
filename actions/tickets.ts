'use server'

import { createClient } from '@/lib/supabase/server'
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
    property_id?: string
    unit_id?: string
    category?: string
    priority?: string
    status?: string
    assigned_to?: string
    urgent_only?: boolean
}

/**
 * Get paginated and filtered tickets based on user role
 */
export async function getTickets(filters: TicketFilters = {}, page = 1, limit = 20) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { data: null, error: 'Not authenticated' }
    }

    let query = supabase
        .from('tickets')
        .select(`
      *,
      property:properties(*),
      unit:units(*),
      assigned_to:profiles!tickets_assigned_to_user_id_fkey(id, full_name),
      created_by_profile:profiles!tickets_created_by_fkey(id, full_name)
    `, { count: 'exact' })

    // Apply filters
    if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%,property.name.ilike.%${filters.search}%`)
    }

    if (filters.property_id) {
        query = query.eq('property_id', filters.property_id)
    }

    if (filters.unit_id) {
        query = query.eq('unit_id', filters.unit_id)
    }

    if (filters.category) {
        query = query.eq('category', filters.category)
    }

    if (filters.priority) {
        query = query.eq('priority', filters.priority)
    }

    if (filters.status) {
        query = query.eq('status', filters.status)
    }

    if (filters.assigned_to) {
        query = query.eq('assigned_to_user_id', filters.assigned_to)
    }

    if (filters.urgent_only) {
        query = query.eq('priority', 'urgent')
    }

    // Note: RLS policies will automatically filter based on role
    // Admin/Sub Director: see all
    // Maintenance: see assigned
    // Reporter: see own

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

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
        limit,
        totalPages: Math.ceil((count || 0) / limit),
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

    // Create audit log
    await (supabase.from('ticket_audit_logs') as any).insert({
        ticket_id: ticketId,
        actor_id: user.id,
        action: 'status_changed',
        from_value: null, // TODO: Get old value
        to_value: { status },
    })

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

    // Create audit log
    await (supabase.from('ticket_audit_logs') as any).insert({
        ticket_id: ticketId,
        actor_id: user.id,
        action: 'assigned',
        from_value: null,
        to_value: { assigned_to_user_id: userId },
    })

    revalidatePath('/dashboard')
    revalidatePath(`/tickets/${ticketId}`)

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
        await (supabase.from('ticket_audit_logs') as any).insert({
            ticket_id: ticketId,
            actor_id: user.id,
            action: actions.join(', '),
            from_value: oldTicket,
            to_value: finalUpdates,
        })
    }

    revalidatePath('/dashboard')
    revalidatePath(`/tickets/${ticketId}`)

    return { data }
}
