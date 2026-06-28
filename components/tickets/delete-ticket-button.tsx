'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { deleteTicket } from '@/actions/tickets'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DeleteTicketButtonProps {
    ticketId: string
    className?: string
}

export function DeleteTicketButton({ ticketId, className }: DeleteTicketButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsLoading(true)
        const result = await deleteTicket(ticketId)
        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Ticket eliminado con éxito')
            setIsModalOpen(false)
        }
    }

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                className={`text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ${className}`}
                onClick={() => setIsModalOpen(true)}
                title="Eliminar Ticket"
            >
                <Trash2 size={16} />
            </Button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => !isLoading && setIsModalOpen(false)}
                title="Eliminar Ticket"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-500 p-3 rounded-lg">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">Advertencia: Esta acción no se puede deshacer.</p>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300">
                        ¿Está seguro de que desea eliminar permanentemente este ticket? Se eliminarán todos los comentarios, gastos y archivos adjuntos asociados.
                    </p>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar Ticket'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
