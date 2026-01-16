'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { createUnit, updateUnit, deleteUnit } from '@/actions/units'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Unit = Database['public']['Tables']['units']['Row'] & {
    property?: { name: string } | null
}
type Property = Database['public']['Tables']['properties']['Row']

interface UnitManagementProps {
    units: Unit[]
    properties: Property[]
}

export function UnitManagement({ units, properties }: UnitManagementProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form states
    const [name, setName] = useState('')
    const [propertyId, setPropertyId] = useState('')
    const [notes, setNotes] = useState('')

    const openAddModal = () => {
        setName('')
        setPropertyId(properties[0]?.id || '')
        setNotes('')
        setIsAddModalOpen(true)
    }

    const openEditModal = (unit: Unit) => {
        setEditingUnit(unit)
        setName(unit.name)
        setPropertyId(unit.property_id)
        setNotes(unit.notes || '')
    }

    const closeModals = () => {
        setIsAddModalOpen(false)
        setEditingUnit(null)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!propertyId) {
            toast.error('Please select a property')
            return
        }
        setIsLoading(true)
        const { error } = await createUnit({
            name,
            property_id: propertyId,
            notes: notes || null
        })
        setIsLoading(false)

        if (error) {
            toast.error(error)
        } else {
            toast.success('Unit created successfully')
            closeModals()
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUnit) return
        setIsLoading(true)
        const { error } = await updateUnit(editingUnit.id, {
            name,
            property_id: propertyId,
            notes: notes || null
        })
        setIsLoading(false)

        if (error) {
            toast.error(error)
        } else {
            toast.success('Unit updated successfully')
            closeModals()
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete unit "${name}"? This will fail if there are tickets associated with it.`)) {
            return
        }

        setIsLoading(true)
        const { error } = await deleteUnit(id)
        setIsLoading(false)

        if (error) {
            toast.error(error)
        } else {
            toast.success('Unit deleted successfully')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Units</h2>
                <Button onClick={openAddModal} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Unit
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unit Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Property</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {units.map((unit) => (
                            <tr key={unit.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {unit.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Building2 size={14} />
                                        {(unit.property as any)?.name || 'Unknown'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {unit.notes || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openEditModal(unit)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(unit.id, unit.name)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={closeModals}
                title="Add New Unit"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit Name</label>
                        <Input
                            placeholder="e.g. Apt 101"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Property</label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={propertyId}
                            onChange={(e) => setPropertyId(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select a property</option>
                            {properties.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                        <Input
                            placeholder="e.g. Second floor"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={closeModals}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Unit
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingUnit}
                onClose={closeModals}
                title="Edit Unit"
            >
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit Name</label>
                        <Input
                            placeholder="e.g. Apt 101"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Property</label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={propertyId}
                            onChange={(e) => setPropertyId(e.target.value)}
                            required
                        >
                            {properties.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                        <Input
                            placeholder="e.g. Second floor"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={closeModals}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
