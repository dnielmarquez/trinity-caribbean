'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { updateProfile } from '@/actions/users'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type UserRole = Database['public']['Enums']['user_role']

interface UserEditModalProps {
    user: Profile | null
    isOpen: boolean
    onClose: () => void
}

const ROLES: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'sub_director', label: 'Sub Director' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'housekeeper', label: 'Housekeeper' },
    { value: 'reporter', label: 'Reporter' },
]

export function UserEditModal({ user, isOpen, onClose }: UserEditModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [role, setRole] = useState<UserRole>(user?.role || 'reporter')
    const [telegramChatId, setTelegramChatId] = useState(user?.telegram_chat_id || '')

    // State is initialized on mount. Parent uses key={user.id} to force remount on user change.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsLoading(true)
        const result = await updateProfile(user.id, {
            role,
            telegram_chat_id: telegramChatId.trim() || null
        })

        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('User updated successfully')
            onClose()
        }
    }

    // Effect to sync state when user prop changes (e.g. opening different user)
    // We can use a key in parent, but let's add a quick sync here or just render conditionally.
    // To be safe against stale state:
    // This is a simple implementation; ideally use a form library or key={} in parent.

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit User: ${user?.full_name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Role
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                    >
                        {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Telegram Chat ID
                    </label>
                    <Input
                        placeholder="e.g. 123456789"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Used for sending notifications to this user via Telegram bot.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
