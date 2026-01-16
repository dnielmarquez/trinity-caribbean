
import { Database } from './types/database'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient<Database>('https://xyz.supabase.co', 'public-anon-key')

async function test() {
    // Test profiles (known good?)
    await supabase.from('profiles').insert({
        id: '123',
        full_name: 'Test',
        role: 'reporter'
    })

    // Test ticket_audit_logs again
    await supabase.from('ticket_audit_logs').insert({
        ticket_id: '123',
        actor_id: '123',
        action: 'test',
        from_value: null,
        to_value: { foo: 'bar' }
    })
}
