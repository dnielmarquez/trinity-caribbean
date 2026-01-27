'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { createProperty, updateProperty, deleteProperty } from '@/actions/properties'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']

interface PropertyManagementProps {
    properties: Property[]
}

export function PropertyManagement({ properties }: PropertyManagementProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingProperty, setEditingProperty] = useState<Property | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form states
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')

    const openAddModal = () => {
        setName('')
        setAddress('')
        setIsAddModalOpen(true)
    }

    const openEditModal = (property: Property) => {
        setEditingProperty(property)
        setName(property.name)
        setAddress(property.address || '')
    }

    const closeModals = () => {
        setIsAddModalOpen(false)
        setEditingProperty(null)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        const { error } = await createProperty({ name, address: address || null })
        setIsLoading(false)

        if (error) {
            toast.error(error)
        } else {
            toast.success('Property created successfully')
            closeModals()
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingProperty) return
        setIsLoading(true)
        const { error } = await updateProperty(editingProperty.id, { name, address: address || null })
        setIsLoading(false)

        if (error) {
            toast.error(error)
        } else {
            toast.success('Property updated successfully')
            closeModals()
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This will fail if there are units or tickets associated with it.`)) {
            return
        }

        setIsLoading(true)
        const { error } = await deleteProperty(id)
        setIsLoading(false)

        if (error) {
            toast.error(error)
        } else {
            toast.success('Property deleted successfully')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Properties</h2>
                <Button onClick={openAddModal} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Property
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Address</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {properties.map((property) => (
                                <tr key={property.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {property.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {property.address || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(property)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(property.id, property.name)}
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
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={closeModals}
                title="Add New Property"
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <Input
                            placeholder="e.g. Ocean View"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address (Optional)</label>
                        <Input
                            placeholder="123 Beach Rd"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="outline" onClick={closeModals}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Property
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingProperty}
                onClose={closeModals}
                title="Edit Property"
            >
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <Input
                            placeholder="e.g. Ocean View"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address (Optional)</label>
                        <Input
                            placeholder="123 Beach Rd"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
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
