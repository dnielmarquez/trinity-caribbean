'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TicketEditForm } from './ticket-edit-form'
import type { Database } from '@/types/database'

type Ticket = Database['public']['Tables']['tickets']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface TicketEditButtonProps {
    ticket: Ticket
    staff: Pick<Profile, 'id' | 'full_name' | 'role'>[]
}

export function TicketEditButton({ ticket, staff }: TicketEditButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2"
            >
                <Pencil size={14} />
                Edit Ticket
            </Button>

            <TicketEditForm
                ticket={ticket}
                staff={staff}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    )
}
