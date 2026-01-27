'use client'

import { useState } from 'react'
import { StatusBadge } from './status-badge'
import { Database } from '@/types/database'
import { STATUSES } from '@/lib/categories'
import { updateTicketStatus } from '@/actions/tickets'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'

import { cn } from '@/lib/utils'

type TicketStatus = Database['public']['Enums']['ticket_status']

interface InlineStatusSelectProps {
    ticketId: string
    status: TicketStatus
    canEdit: boolean
}

export function InlineStatusSelect({ ticketId, status, canEdit }: InlineStatusSelectProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    if (!canEdit) {
        return <StatusBadge status={status} />
    }

    const handleStatusChange = async (newStatus: TicketStatus) => {
        if (newStatus === status) return

        setIsUpdating(true)
        try {
            const result = await updateTicketStatus(ticketId, newStatus)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Status updated')
            }
        } catch (error) {
            toast.error('Failed to update status')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={cn("cursor-pointer transition-opacity text-left", isUpdating && "opacity-50 pointer-events-none")}>
                    <StatusBadge status={status} />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {Object.entries(STATUSES).map(([key, config]) => (
                    <DropdownMenuItem
                        key={key}
                        onClick={() => handleStatusChange(key as TicketStatus)}
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
