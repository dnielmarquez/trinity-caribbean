
import { Database as OriginalDatabase } from './types/database'
import { createClient } from '@supabase/supabase-js'

// Mock Json as any
type SimpleJson = any

// Override the table definition
type FixedDatabase = {
    public: {
        Tables: {
            ticket_audit_logs: {
                Row: Omit<OriginalDatabase['public']['Tables']['ticket_audit_logs']['Row'], 'from_value' | 'to_value'> & {
                    from_value: SimpleJson | null
                    to_value: SimpleJson | null
                }
                Insert: Omit<OriginalDatabase['public']['Tables']['ticket_audit_logs']['Insert'], 'from_value' | 'to_value'> & {
                    from_value?: SimpleJson | null
                    to_value?: SimpleJson | null
                }
                Update: Omit<OriginalDatabase['public']['Tables']['ticket_audit_logs']['Update'], 'from_value' | 'to_value'> & {
                    from_value?: SimpleJson | null
                    to_value?: SimpleJson | null
                }
                Relationships: [] // Add this too just in case
            }
        }
    }
}

const supabase = createClient<FixedDatabase>('https://xyz.supabase.co', 'public-anon-key')

async function test() {
    await supabase.from('ticket_audit_logs').insert({
        ticket_id: '123',
        actor_id: '123',
        action: 'test',
        from_value: null,
        // This should definitely work if Json usage was the problem
        to_value: { assigned_to_user_id: '123' },
    })
}
