'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

export async function createUser(formData: FormData) {
    // Verify permission first
    const currentUser = await getCurrentUser()
    // @ts-ignore
    if (!currentUser || currentUser.profile?.role !== 'admin') {
        return { error: 'Unauthorized' }
    }

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as string

    if (!email || !password || !fullName || !role) {
        return { error: 'Missing required fields' }
    }

    const supabaseAdmin = createServiceClient()

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
        }
    })

    if (authError) {
        console.error('Error creating auth user:', authError)
        return { error: authError.message }
    }

    if (!authData.user) {
        return { error: 'Failed to create user' }
    }

    // 2. Update Profile Role
    // The profile might be created by a trigger on public.users, or we might need to create it manually depending on setup.
    // Usually triggers handle it. But we need to update the role. 
    // Wait for a moment or try to update directly. 
    // If we rely on trigger, it initiates as 'reporter' usually. 
    // Let's force update the profile.

    // Note: If using a trigger, there might be a race condition. 
    // But since we are using the admin client, we can upsert the profile.

    // 2. Update/Create Profile
    // We force an upsert to ensure the profile exists and has the correct role,
    // regardless of whether a trigger created it or not.

    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        // @ts-ignore
        .upsert({
            id: authData.user.id,
            full_name: fullName,
            role: role,
            updated_at: new Date().toISOString(),
        })

    if (profileError) {
        console.error('Error upserting profile:', profileError)
        // Clean up auth user if profile fails?
        // Ideally yes, but for now let's just report error.
        return { error: 'User created but failed to set role: ' + profileError.message }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function updateProfile(userId: string, data: Database['public']['Tables']['profiles']['Update']) {
    const currentUser = await getCurrentUser()
    // @ts-ignore
    if (!currentUser || currentUser.profile?.role !== 'admin') {
        return { error: 'Unauthorized' }
    }

    const supabaseAdmin = createServiceClient()

    const { error } = await supabaseAdmin
        .from('profiles')
        // @ts-ignore
        .update(data)
        .eq('id', userId)

    if (error) {
        console.error('Error updating profile:', error)
        return { error: error.message }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const currentUser = await getCurrentUser()
    // @ts-ignore
    if (!currentUser || currentUser.profile?.role !== 'admin') {
        return { error: 'Unauthorized' }
    }

    const supabaseAdmin = createServiceClient()

    // Delete from public.profiles first (if no cascade) or just to be sure
    // We ignore error here because if it doesn't exist or foreign key prevents it (and we rely on auth cascade), it's fine.
    // However, if we CAN delete it, we should.
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (profileError) {
        // Check for Foreign Key violation (Code 23503) from Postgres
        if (profileError.code === '23503') {
            return { error: 'Cannot delete user: This user is assigned to existing tasks (Tickets or Preventive). Please reassign or remove their tasks first.' }
        }

        console.error('Error deleting profile (might be handled by cascade):', profileError)
    }

    // Delete from Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
        return { error: authError.message }
    }

    revalidatePath('/admin')
    return { success: true }
}
