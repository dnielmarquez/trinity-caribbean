import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    // 1. Basic Auth Validation
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        console.log('API Auth: Missing or invalid Authorization header')
        return new NextResponse('Unauthorized', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
        })
    }

    const authValue = authHeader.split(' ')[1]
    const decoded = Buffer.from(authValue, 'base64').toString()
    const [user, ...pwdParts] = decoded.split(':')
    const pwd = pwdParts.join(':') // Re-join in case password has colons

    const validUser = process.env.N8N_API_USER
    const validPass = process.env.N8N_API_PASSWORD

    // Strict check ensuring vars are defined
    if (!validUser || !validPass) {
        console.error('API Auth: Environment variables for N8N Auth are missing!')
        return new NextResponse('Server Configuration Error', { status: 500 })
    }

    if (user !== validUser || pwd !== validPass) {
        console.log(`API Auth: Failed login attempt for user: ${user}`)
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
