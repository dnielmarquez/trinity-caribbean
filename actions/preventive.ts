'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type PreventiveTask = Database['public']['Tables']['preventive_tasks']['Row']
type InsertPreventiveTask = Database['public']['Tables']['preventive_tasks']['Insert']

export async function getPreventiveTasks(filters: { property_id?: string }) {
    const supabase = await createClient()

    let query = supabase
        .from('preventive_tasks')
        .select(`
            *,
            property:properties(name),
            unit:units(name),
            assigned_to:profiles!preventive_tasks_assigned_to_user_id_fkey(full_name)
        `)
        .order('next_scheduled_at', { ascending: true })

    if (filters.property_id && filters.property_id !== 'all') {
        query = query.eq('property_id', filters.property_id)
    }

    const { data: tasks, error } = await query

    if (error) {
        console.error('Error fetching preventive tasks:', error)
        return { error: 'Failed to fetch preventive tasks' }
    }

    return { data: tasks }
}

export async function createPreventiveTask(data: InsertPreventiveTask) {
    const user = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const supabase = await createClient()

    const { data: task, error } = await (supabase
        .from('preventive_tasks') as any)
        .insert({
            ...data,
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating preventive task:', error)
        return { error: error.message }
    }

    revalidatePath('/preventive')
    return { data: task }
}

export async function updatePreventiveTask(id: string, updates: Partial<PreventiveTask>) {
    const user = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const supabase = await createClient()

    const { data: task, error } = await (supabase
        .from('preventive_tasks') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating preventive task:', error)
        return { error: error.message }
    }

    revalidatePath('/preventive')
    return { data: task }
}

export async function deletePreventiveTask(id: string) {
    const user = await getCurrentUser()
    if (!user) return { error: 'Unauthorized' }

    const supabase = await createClient()

    const { error } = await supabase
        .from('preventive_tasks')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting preventive task:', error)
        return { error: error.message }
    }

    revalidatePath('/preventive')
    return { success: true }
}
