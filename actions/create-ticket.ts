'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendTicketCreatedNotification, sendUrgentTicketNotification, sendTicketAssignedNotification } from '@/lib/notifications'

const createTicketSchema = z.object({
    property_id: z.string().uuid(),
    unit_id: z.string().uuid().optional().nullable(),
    type: z.enum(['corrective', 'preventive']),
    category: z.enum(['ac', 'appliances', 'plumbing', 'wifi', 'furniture', 'locks', 'electricity', 'painting', 'cleaning', 'pest_control', 'other']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    requires_spend: z.boolean().optional(),
    initial_comment: z.string().optional(),
    attachments: z.array(z.object({
        url: z.string().url(),
        kind: z.enum(['image', 'video', 'invoice'])
    })).optional(),
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

    const role = (user.profile as any)?.role
    const isMaintenance = role === 'maintenance'

    // Determine target subrole based on category: "ac" -> "ac-specialist", others -> "handyman"
    const targetSubrole = validated.data.category === 'ac' ? 'ac-specialist' : 'handyman'

    // Find profile matching role 'maintenance' and target subrole
    const { data: assigneeProfile } = await (supabase
        .from('profiles') as any)
        .select('id, full_name, role, telegram_chat_id')
        .eq('role', 'maintenance')
        .eq('sub_role', targetSubrole)
        .limit(1)
        .maybeSingle()

    const assigned_to_user_id = assigneeProfile?.id || (isMaintenance ? user.id : null)
    const status = assigned_to_user_id ? 'assigned' : 'reported'

    const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
            ...validated.data,
            // Remove initial_comment and attachments from ticket data
            initial_comment: undefined,
            attachments: undefined,
            unit_id: validated.data.unit_id || null,
            created_by: user.id,
            requires_spend: validated.data.requires_spend || false,
            assigned_to_user_id,
            status,
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
        to_value: {
            status,
            assigned_to_user_id,
            assigned_to_name: assigneeProfile ? assigneeProfile.full_name : (isMaintenance ? (user as any).profile?.full_name : null)
        },
    } as any)

    if ((ticket as any).priority === 'urgent') {
        await sendUrgentTicketNotification(ticket as any)
    }

    // Send assignment notification if assigned
    if (assigned_to_user_id) {
        const targetProfile = assigneeProfile || (isMaintenance ? (user as any).profile : null)
        if (targetProfile) {
            try {
                await sendTicketAssignedNotification(ticket as any, targetProfile as any)
            } catch (err) {
                console.error('Failed to send ticket assigned notification:', err)
            }
        }
    }

    // Webhook for Ticket Assignment (All priorities)
    if (assigned_to_user_id) {
        try {
            const assigneeTelegramChatId = assigneeProfile?.telegram_chat_id || (isMaintenance ? (user as any).profile?.telegram_chat_id : null)
            if (assigneeTelegramChatId) {
                const webhookUrl = process.env.N8N_TICKET_ASSIGNED_WEBHOOK_URL
                if (webhookUrl) {
                    const payload = {
                        ticket_id: (ticket as any).id,
                        assigned_by: (user as any).profile?.full_name || 'System',
                        category: (ticket as any).category,
                        description: (ticket as any).description,
                        user_telegram_chat_id: assigneeTelegramChatId,
                        user_id: assigned_to_user_id,
                        priority: (ticket as any).priority
                    }
                    await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                }
            }
        } catch (err) {
            console.error('Failed to trigger assigned webhook:', err)
        }
    }

    // Webhook for Ticket Creation (All priorities)
    try {
        const webhookUrl = process.env.N8N_TICKET_CREATED_WEBHOOK_URL
        if (webhookUrl) {
            const payload: any = {
                ticket_id: (ticket as any).id,
                created_by: (user as any).profile?.full_name || 'System', // Renamed from assigned_by
                category: (ticket as any).category,
                description: (ticket as any).description,
                priority: (ticket as any).priority,
                created_by_id: user.id
            }

            // Fetch Housekeeper (Always included)
            const { data: housekeeper } = await (supabase
                .from('profiles') as any)
                .select('telegram_chat_id')
                .eq('role', 'housekeeper')
                .limit(1)
                .single()

            if (housekeeper?.telegram_chat_id) {
                payload.housekeeper_telegram_chat_id = housekeeper.telegram_chat_id
            }

            // If Urgent, add Sub Director Chat ID
            if ((ticket as any).priority === 'urgent') {
                const { data: subDirector } = await (supabase
                    .from('profiles') as any)
                    .select('telegram_chat_id')
                    .eq('role', 'sub_director')
                    .limit(1)
                    .single()

                if (subDirector?.telegram_chat_id) {
                    payload.sub_director_telegram_chat_id = subDirector.telegram_chat_id
                }
            }

            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
        }
    } catch (err) {
        console.error('Failed to trigger created webhook:', err)
    }

    // Add initial comment if present
    if (validated.data.initial_comment && validated.data.initial_comment.trim().length > 0) {
        // Append attachment links to comment body
        let commentBody = validated.data.initial_comment.trim()

        if (validated.data.attachments && validated.data.attachments.length > 0) {
            commentBody += '\n\n'
            validated.data.attachments.forEach(att => {
                if (att.kind === 'image') {
                    commentBody += `![Image](${att.url})\n`
                } else if (att.kind === 'video') {
                    // For videos we can use a link or custom syntax if we have a player
                    commentBody += `[Video](${att.url})\n`
                }
            })
        }

        await supabase.from('ticket_comments').insert({
            ticket_id: (ticket as any).id,
            author_id: user.id,
            body: commentBody,
        } as any)
    }

    // Save attachments to database
    if (validated.data.attachments && validated.data.attachments.length > 0) {
        const attachmentInserts = validated.data.attachments.map(att => ({
            ticket_id: (ticket as any).id,
            url: att.url,
            kind: att.kind,
            uploaded_by: user.id
        }))

        await supabase.from('ticket_attachments').insert(attachmentInserts as any)
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

    // validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
        return { error: 'File size too large (max 50MB)' }
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
