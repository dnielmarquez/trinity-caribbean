import { getPriorityConfig } from '@/lib/categories'
import type { Database } from '@/types/database'
import { Badge } from '@/components/ui/badge'

type Priority = Database['public']['Enums']['ticket_priority']

interface PriorityBadgeProps {
    priority: Priority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
    const config = getPriorityConfig(priority)

    return (
        <Badge
            className={`${config.bgColor} ${config.color} border-0`}
        >
            {config.label}
        </Badge>
    )
}
