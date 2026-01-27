'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { uploadFile } from './storage' // Reuse existing upload capability

export async function addExpense(formData: FormData) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const ticketId = formData.get('ticketId') as string
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const file = formData.get('file') as File | null

    if (!ticketId || !description || isNaN(amount)) {
        return { error: 'Invalid input' }
    }

    let attachmentUrl = null
    if (file && file.size > 0) {
        // We reuse the basic upload logic, but we might want to store it in a specific folder
        // The existing uploadFile action expects a FormData with 'file' and 'ticketId'
        // We can just call it or replicate logic. 
        // Let's replicate simple logic here to avoid overhead of creating another FormData object
        // OR better: use the exported `uploadFile` via a new helper or directly if it was flexible. 
        // The `uploadFile` in storage.ts is clean. let's wrap it in a FormData.

        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('ticketId', ticketId)

        const { publicUrl, error } = await uploadFile(uploadFormData)
        if (error) return { error }
        attachmentUrl = publicUrl
    }

    const { data, error } = await (supabase.from('ticket_expenses') as any).insert({
        ticket_id: ticketId,
        description,
        amount,
        attachment_url: attachmentUrl,
        created_by: user.id
    })
        .select()
        .single()

    if (error) {
        console.error('Error adding expense:', error)
        return { error: error.message }
    }

    // Audit log
    await (supabase.from('ticket_audit_logs') as any).insert({
        ticket_id: ticketId,
        actor_id: user.id,
        action: 'expense_added',
        to_value: { description, amount, attachment_url: attachmentUrl }
    })

    revalidatePath(`/tickets/${ticketId}`)
    return { data }
}

export async function deleteExpense(expenseId: string, ticketId: string) {
    const supabase = await createClient()
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Get expense details for audit log before delete
    const { data: expense } = await (supabase.from('ticket_expenses') as any)
        .select('*')
        .eq('id', expenseId)
        .single()

    const { error } = await (supabase.from('ticket_expenses') as any)
        .delete()
        .eq('id', expenseId)

    if (error) {
        return { error: error.message }
    }

    // Audit log
    if (expense) {
        await (supabase.from('ticket_audit_logs') as any).insert({
            ticket_id: ticketId,
            actor_id: user.id,
            action: 'expense_removed',
            from_value: expense
        })
    }

    revalidatePath(`/tickets/${ticketId}`)
    return { success: true }
}

export async function getExpenses(ticketId: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase.from('ticket_expenses') as any)
        .select(`
            *,
            created_by_profile:profiles!created_by(full_name)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching expenses:', error)
        return { data: [] }
    }

    return { data }
}
