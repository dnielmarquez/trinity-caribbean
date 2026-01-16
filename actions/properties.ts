'use server'

import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']
type PropertyInsert = Database['public']['Tables']['properties']['Insert']
type PropertyUpdate = Database['public']['Tables']['properties']['Update']

export async function getProperties() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching properties:', error)
        return { data: null, error: error.message }
    }

    return { data, error: null }
}

export async function createProperty(property: PropertyInsert) {
    await requirePermission('canManageProperties')
    const supabase = await createClient()

    const { data, error } = await (supabase.from('properties') as any)
        .insert(property)
        .select()
        .single()

    if (error) {
        console.error('Error creating property:', error)
        return { data: null, error: error.message }
    }

    revalidatePath('/admin')
    return { data, error: null }
}

export async function updateProperty(id: string, property: PropertyUpdate) {
    await requirePermission('canManageProperties')
    const supabase = await createClient()

    const { data, error } = await (supabase.from('properties') as any)
        .update(property)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating property:', error)
        return { data: null, error: error.message }
    }

    revalidatePath('/admin')
    return { data, error: null }
}

export async function deleteProperty(id: string) {
    await requirePermission('canManageProperties')
    const supabase = await createClient()

    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting property:', error)
        return { error: error.message }
    }

    revalidatePath('/admin')
    return { error: null }
}
