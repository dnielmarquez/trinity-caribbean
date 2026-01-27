'use client'

import { useState } from 'react'
import { PriorityBadge } from './priority-badge'
import { Database } from '@/types/database'
import { PRIORITIES } from '@/lib/categories'
import { updateTicket } from '@/actions/tickets'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type TicketPriority = Database['public']['Enums']['ticket_priority']

interface InlinePrioritySelectProps {
    ticketId: string
    priority: TicketPriority
    canEdit: boolean
}

export function InlinePrioritySelect({ ticketId, priority, canEdit }: InlinePrioritySelectProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    if (!canEdit) {
        return <PriorityBadge priority={priority} />
    }

    const handlePriorityChange = async (newPriority: TicketPriority) => {
        if (newPriority === priority) return

        setIsUpdating(true)
        try {
            const result = await updateTicket(ticketId, { priority: newPriority })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Priority updated')
            }
        } catch (error) {
            toast.error('Failed to update priority')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={cn("cursor-pointer transition-opacity text-left", isUpdating && "opacity-50 pointer-events-none")}>
                    <PriorityBadge priority={priority} />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {Object.entries(PRIORITIES).map(([key, config]) => (
                    <DropdownMenuItem
                        key={key}
                        onClick={() => handlePriorityChange(key as TicketPriority)}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <span className={cn("w-2 h-2 rounded-full", config.color.replace('text-', 'bg-').replace('600', '500'))} />
                        {config.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
