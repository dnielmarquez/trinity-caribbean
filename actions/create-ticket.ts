'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendTicketCreatedNotification, sendUrgentTicketNotification } from '@/lib/notifications'

const createTicketSchema = z.object({
    property_id: z.string().uuid(),
    unit_id: z.string().uuid().optional().nullable(),
    type: z.enum(['corrective', 'preventive']),
    category: z.enum(['ac', 'appliances', 'plumbing', 'wifi', 'furniture', 'locks', 'electricity', 'painting', 'cleaning', 'pest_control', 'other']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    requires_spend: z.boolean().optional(),
})

export async function createTicket(data: z.infer<typeof createTicketSchema>) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Validate
    const validated = createTicketSchema.safeParse(data)
    if (!validated.success) {
        return { error: validated.error.errors[0].message }
    }

    const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
            ...validated.data,
            unit_id: validated.data.unit_id || null,
            created_by: user.id,
            requires_spend: validated.data.requires_spend || false,
        } as any) // Type assertion to bypass type inference issue
        .select()
        .single()

    if (error) {
        console.error('Error creating ticket:', error)
        return { error: error.message }
    }

    // Create audit log
    await supabase.from('ticket_audit_logs').insert({
        ticket_id: (ticket as any).id,
        actor_id: user.id,
        action: 'created',
        from_value: null,
        to_value: { status: 'reported' },
    } as any)

    // Send notifications (placeholder)
    await sendTicketCreatedNotification(ticket as any, user.profile)

    if ((ticket as any).priority === 'urgent') {
        await sendUrgentTicketNotification(ticket as any)
    }

    revalidatePath('/dashboard')
    revalidatePath('/tickets')

    return { data: ticket }
}

/**
 * Upload attachment for a ticket
 */
export async function uploadTicketAttachment(
    ticketId: string,
    file: File,
    kind: 'image' | 'video' | 'invoice'
) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${ticketId}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file)

    if (uploadError) {
        return { error: uploadError.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(fileName)

    // Save attachment record
    const { data, error } = await supabase
        .from('ticket_attachments')
        .insert({
            ticket_id: ticketId,
            url: publicUrl,
            kind,
            uploaded_by: user.id,
        } as any) // Type assertion to bypass type inference issue
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/tickets/${ticketId}`)

    return { data }
}
