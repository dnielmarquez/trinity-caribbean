'use server'

import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Unit = Database['public']['Tables']['units']['Row']
type UnitInsert = Database['public']['Tables']['units']['Insert']
type UnitUpdate = Database['public']['Tables']['units']['Update']

export async function getUnits(propertyId?: string) {
    const supabase = await createClient()
    let query = supabase.from('units').select('*, property:properties(name)')

    if (propertyId) {
        query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query.order('name')

    if (error) {
        console.error('Error fetching units:', error)
        return { data: null, error: error.message }
    }

    return { data, error: null }
}

export async function createUnit(unit: UnitInsert) {
    await requirePermission('canManageProperties')
    const supabase = await createClient()

    const { data, error } = await (supabase.from('units') as any)
        .insert(unit)
        .select()
        .single()

    if (error) {
        console.error('Error creating unit:', error)
        return { data: null, error: error.message }
    }

    revalidatePath('/admin')
    return { data, error: null }
}

export async function updateUnit(id: string, unit: UnitUpdate) {
    await requirePermission('canManageProperties')
    const supabase = await createClient()

    const { data, error } = await (supabase.from('units') as any)
        .update(unit)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating unit:', error)
        return { data: null, error: error.message }
    }

    revalidatePath('/admin')
    return { data, error: null }
}

export async function deleteUnit(id: string) {
    await requirePermission('canManageProperties')
    const supabase = await createClient()

    const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting unit:', error)
        return { error: error.message }
    }

    revalidatePath('/admin')
    return { error: null }
}
