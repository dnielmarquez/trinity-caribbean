const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function testQuery() {
    let ticketsQuery = supabase
        .from('tickets')
        .select(`
            id,
            ticket_costs!inner ( total_amount )
        `)
        .limit(5)

    const { data: tickets, error } = await ticketsQuery
    console.log('Error:', error)
    console.log('Tickets:', JSON.stringify(tickets, null, 2))
}

testQuery()
