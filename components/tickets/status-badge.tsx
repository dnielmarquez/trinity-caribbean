import { getStatusConfig } from '@/lib/categories'
import type { Database } from '@/types/database'
import { Badge } from '@/components/ui/badge'

type Status = Database['public']['Enums']['ticket_status']

interface StatusBadgeProps {
    status: Status
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = getStatusConfig(status)

    return (
        <Badge
            className={`${config.bgColor} ${config.color} border-0`}
        >
            {config.label}
        </Badge>
    )
}
