'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'

/**
 * Upload a file to storage and return its public URL
 */
export async function uploadFile(formData: FormData) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const file = formData.get('file') as File
    const ticketId = formData.get('ticketId') as string // Optional: for folder organization

    if (!file) {
        return { error: 'No file provided' }
    }

    // validate file size (e.g. 10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        return { error: 'File size too large (max 10MB)' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${ticketId || 'temp'}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file)

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: 'Failed to upload file' }
    }

    const { data: { publicUrl } } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(fileName)

    return { publicUrl }
}

/**
 * Register an attachment in the database
 */
export async function saveAttachment(
    ticketId: string,
    url: string,
    kind: 'image' | 'video' | 'invoice'
) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
        .from('ticket_attachments')
        .insert({
            ticket_id: ticketId,
            url,
            kind,
            uploaded_by: user.id,
        } as any)
        .select()
        .single()

    if (error) {
        console.error('Database error:', error)
        return { error: 'Failed to save attachment record' }
    }

    // Audit Log for Evidence
    // We don't await this to keep UI snappy, but for crucial logs await is safer.
    // Given the "Error 42501" history, lets await and log usage.
    const { error: auditError } = await (supabase.from('ticket_audit_logs') as any).insert({
        ticket_id: ticketId,
        actor_id: user.id,
        action: 'evidence_added',
        from_value: null,
        to_value: { kind, url },
    })

    if (auditError) {
        console.error('Error inserting audit log (evidence):', auditError)
    }

    revalidatePath(`/tickets/${ticketId}`)
    return { data }
}
