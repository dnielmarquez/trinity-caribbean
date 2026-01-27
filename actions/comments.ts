'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

export type Comment = Database['public']['Tables']['ticket_comments']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export interface CommentWithAuthor extends Comment {
    author: Pick<Profile, 'full_name' | 'role'>
}

/**
 * Add a comment to a ticket
 */
export async function addComment(ticketId: string, body: string) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    if (!body || body.trim().length === 0) {
        return { error: 'Comment cannot be empty' }
    }

    const { data, error } = await (supabase
        .from('ticket_comments') as any)
        .insert({
            ticket_id: ticketId,
            author_id: user.id,
            body: body.trim(),
        })
        .select(`
            *,
            author:profiles(full_name, role)
        `)
        .single()

    if (error) {
        console.error('Error adding comment:', error)
        return { error: error.message }
    }

    // revalidatePath(`/tickets/${ticketId}`)
    // revalidatePath('/dashboard') 
    // Commented out revalidation here because we often want to update local state 
    // immediately without full page reload or when using in a modal. 
    // But for "server action only" flows, we might want it.
    // Let's enable it as it's safer for consistency.
    revalidatePath(`/tickets/${ticketId}`)

    // TODO: Send notification to assigned user or reporter?

    return { data: data as CommentWithAuthor }
}

/**
 * Fetch comments for a ticket
 */
export async function getComments(ticketId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
            *,
            author:profiles(full_name, role)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
        .returns<CommentWithAuthor[]>()

    if (error) {
        console.error('Error fetching comments:', error)
        return { error: error.message }
    }

    return { data }
}
