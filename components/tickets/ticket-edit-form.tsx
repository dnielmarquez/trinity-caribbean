'use client'

import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { updateTicket } from '@/actions/tickets'
import { toast } from 'sonner'
import { CATEGORIES, STATUSES, PRIORITIES } from '@/lib/categories'
import type { Database } from '@/types/database'

type Ticket = Database['public']['Tables']['tickets']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface TicketEditFormProps {
    ticket: Ticket
    staff: Pick<Profile, 'id' | 'full_name' | 'role'>[]
    isOpen: boolean
    onClose: () => void
}

export function TicketEditForm({ ticket, staff, isOpen, onClose }: TicketEditFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Form states
    const [description, setDescription] = useState(ticket.description)
    const [status, setStatus] = useState(ticket.status)
    const [priority, setPriority] = useState(ticket.priority)
    const [category, setCategory] = useState(ticket.category)
    const [assignedTo, setAssignedTo] = useState(ticket.assigned_to_user_id || '')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const { error } = await updateTicket(ticket.id, {
            description,
            status: status as any,
            priority: priority as any,
            category: category as any,
            assigned_to_user_id: assignedTo || null,
        })

        setIsLoading(false)

        if (error) {
            toast.error(error)
        } else {
            toast.success('Ticket updated successfully')
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Ticket">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white min-h-[100px]"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            required
                        >
                            {Object.entries(STATUSES).map(([id, config]) => (
                                <option key={id} value={id}>{config.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as any)}
                            required
                        >
                            {Object.entries(PRIORITIES).map(([id, config]) => (
                                <option key={id} value={id}>{config.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            required
                        >
                            {Object.entries(CATEGORIES).map(([id, config]) => (
                                <option key={id} value={id}>{config.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Assignment */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assign To</label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                        >
                            <option value="">Unassigned</option>
                            {staff.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name} ({p.role.replace('_', ' ')})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
