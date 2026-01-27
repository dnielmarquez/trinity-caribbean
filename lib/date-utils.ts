import { formatDistanceToNow, differenceInHours, differenceInDays, format } from 'date-fns'

/**
 * Calculate the age/SLA of a ticket in a human-readable format
 */
export function calculateTicketAge(createdAt: string): {
    label: string
    hours: number
    isOverdue: boolean
} {
    const created = new Date(createdAt)
    const now = new Date()
    const hours = differenceInHours(now, created)
    const days = differenceInDays(now, created)

    let label: string
    if (hours < 1) {
        label = 'Just now'
    } else if (hours < 24) {
        label = `${hours}h ago`
    } else {
        label = `${days}d ago`
    }

    // Consider tickets over 48 hours old as potentially overdue
    const isOverdue = hours > 48

    return { label, hours, isOverdue }
}

/**
 * Format a date for display
 */
export function formatDate(date: string | null | undefined): string {
    if (!date) return 'N/A'
    return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/**
 * Format a date for display (Exact Date & Time)
 * e.g. "Oct 12, 2023 2:30 PM"
 */
export function formatDateTime(date: string | null | undefined): string {
    if (!date) return 'N/A'
    return format(new Date(date), 'PP p') // 'PP' = Oct 12, 2023, 'p' = 12:00 PM
}

/**
 * Calculate average resolution time from a set of tickets
 */
export function calculateAverageResolutionTime(
    tickets: { created_at: string; resolved_at: string | null }[]
): number {
    const resolvedTickets = tickets.filter((t) => t.resolved_at)

    if (resolvedTickets.length === 0) return 0

    const totalHours = resolvedTickets.reduce((sum, ticket) => {
        const hours = differenceInHours(
            new Date(ticket.resolved_at!),
            new Date(ticket.created_at)
        )
        return sum + hours
    }, 0)

    return Math.round(totalHours / resolvedTickets.length)
}
