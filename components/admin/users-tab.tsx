'use client'

import { useState } from 'react'
import { Edit2, UserPlus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { UserEditModal } from './user-edit-modal'
import { CreateUserModal } from './create-user-modal'
import { deleteUser } from '@/actions/users'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UsersTabProps {
    profiles: Profile[]
}

export function UsersTab({ profiles }: UsersTabProps) {
    const [editingUser, setEditingUser] = useState<Profile | null>(null)
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const handleDeleteUser = async () => {
        if (!userToDelete) return

        setIsDeleting(true)
        try {
            const result = await deleteUser(userToDelete.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('User deleted successfully')
                setUserToDelete(null)
            }
        } catch (error) {
            toast.error('Failed to delete user')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Telegram ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {profiles.map((profile) => (
                                <tr key={profile.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {profile.full_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize
                                    ${profile.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                                profile.role === 'maintenance' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}
                                `}>
                                            {profile.role.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {profile.telegram_chat_id || <span className="text-gray-400 italic">-</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingUser(profile)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => setUserToDelete(profile)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {editingUser && (
                    <UserEditModal
                        key={editingUser.id} // Forces reset when user changes
                        user={editingUser}
                        isOpen={!!editingUser}
                        onClose={() => setEditingUser(null)}
                    />
                )}

                <CreateUserModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />

                <Modal
                    isOpen={!!userToDelete}
                    onClose={() => setUserToDelete(null)}
                    title="Delete User"
                >
                    <div className="space-y-6">
                        <p className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to delete <strong>{userToDelete?.full_name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setUserToDelete(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteUser}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete User'
                                )}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    )
}
