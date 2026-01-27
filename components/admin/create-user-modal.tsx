'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { createUser } from '@/actions/users'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CreateUserModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'reporter',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const form = new FormData()
        form.append('email', formData.email)
        form.append('password', formData.password)
        form.append('fullName', formData.fullName)
        form.append('role', formData.role)

        const result = await createUser(form)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('User created successfully')
            onClose()
            setFormData({
                email: '',
                password: '',
                fullName: '',
                role: 'reporter',
            })
        }
        setIsLoading(false)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New User">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <Input
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <Input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <Input
                        required
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        minLength={6}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="reporter">Reporter (Tenant/Staff)</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="sub_director">Sub Director</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create User
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
