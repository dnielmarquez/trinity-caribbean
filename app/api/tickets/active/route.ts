import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    // 1. Basic Auth Validation
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
        return new NextResponse('Unauthorized', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
        })
    }

    const authValue = authHeader.split(' ')[1]
    const [user, pwd] = Buffer.from(authValue, 'base64').toString().split(':')

    const validUser = process.env.N8N_API_USER
    const validPass = process.env.N8N_API_PASSWORD

    if (user !== validUser || pwd !== validPass) {
        return new NextResponse('Unauthorized', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
        })
    }

    // 2. Fetch Active Tickets
    try {
        const supabase = createServiceClient()

        // Fetch tickets where status is NOT resolved OR closed
        // Using "not.in" filter
        const { data: tickets, error } = await supabase
            .from('tickets')
            .select('*')
            .not('status', 'in', '("resolved","closed")')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching active tickets:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            count: tickets?.length || 0,
            data: tickets
        })

    } catch (err) {
        console.error('Internal API Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
