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

        // Fetch active tickets
        const { data: tickets, error: ticketsError } = await (supabase
            .from('tickets')
            .select('*')
            .not('status', 'in', '("resolved","closed")')
            .order('created_at', { ascending: false }) as any)

        if (ticketsError) {
            console.error('Error fetching tickets:', ticketsError)
            return NextResponse.json({ error: ticketsError.message }, { status: 500 })
        }

        // Fetch all profiles for reference
        const { data: profiles, error: profilesError } = await (supabase
            .from('profiles')
            .select('id, full_name, role, telegram_chat_id') as any)

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError)
            return NextResponse.json({ error: profilesError.message }, { status: 500 })
        }

        // Map profiles by ID for quick lookup
        const profilesMap = new Map((profiles as any[])?.map(p => [p.id, p]) || [])

        // Enrich tickets
        const enrichedTickets = (tickets as any[])?.map(t => {
            const assignedUser = t.assigned_to_user_id ? profilesMap.get(t.assigned_to_user_id) : null
            return {
                ...t,
                assigned_user_name: assignedUser?.full_name || null,
                assigned_user_telegram_chat_id: assignedUser?.telegram_chat_id || null
            }
        })

        // Extract global roles (first match)
        const subDirector = (profiles as any[])?.find(p => p.role === 'sub_director')
        const housekeeper = (profiles as any[])?.find(p => p.role === 'housekeeper')
        const admin = (profiles as any[])?.find(p => p.role === 'admin')

        return NextResponse.json({
            success: true,
            count: enrichedTickets?.length || 0,
            data: enrichedTickets,
            sub_director_telegram_chat_id: subDirector?.telegram_chat_id || null,
            housekeeper_telegram_chat_id: housekeeper?.telegram_chat_id || null,
            admin_telegram_chat_id: admin?.telegram_chat_id || null
        })

    } catch (err) {
        console.error('Internal API Error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
