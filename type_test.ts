
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

async function test() {
    const supabase = await createClient()

    // Check if supabase is compatible with SupabaseClient<Database>
    const clientCheck: SupabaseClient<Database> = supabase;

    const user = { id: 'test' }
    const ticketId = 'test'
    const userId = 'test'

    // This is the problematic call
    await supabase.from('ticket_audit_logs').insert({
        ticket_id: ticketId,
        actor_id: user.id,
        action: 'assigned',
        from_value: null,
        // @ts-expect-error - Checking if types are strict
        to_value: { assigned_to_user_id: userId },
    })

    // Try a known good table
    await supabase.from('profiles').select('*')
}
