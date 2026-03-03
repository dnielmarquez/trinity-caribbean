'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { updateTicketStatus } from '@/actions/tickets'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ResolveTicketButtonProps {
    ticketId: string
}

export function ResolveTicketButton({ ticketId }: ResolveTicketButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleResolve = async () => {
        setIsLoading(true)
        const result = await updateTicketStatus(ticketId, 'resolved')

        if (result.error) {
            toast.error(result.error)
            setIsLoading(false)
        } else {
            toast.success('Ticket marked as resolved!')
            router.refresh()
            // Keep loading true after success to prevent double clicks during refresh
        }
    }

    return (
        <Button
            onClick={handleResolve}
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg animate-in fade-in slide-in-from-bottom-4"
            size="lg"
        >
            <CheckCircle2 className="w-6 h-6 mr-2" />
            {isLoading ? 'Resolving...' : 'Mark as Resolved'}
        </Button>
    )
}
