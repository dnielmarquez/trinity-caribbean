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
    { value: 'admin', label: 'Administrador' },
    { value: 'sub_director', label: 'Subdirector' },
    { value: 'maintenance', label: 'Mantenimiento' },
    { value: 'housekeeper', label: 'Camarista/Limpieza' },
    { value: 'reporter', label: 'Reportero' },
]

export function UserEditModal({ user, isOpen, onClose }: UserEditModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [role, setRole] = useState<UserRole>(user?.role || 'reporter')
    const [subRole, setSubRole] = useState<'handyman' | 'ac-specialist' | ''>(
        user?.sub_role || ''
    )
    const [telegramChatId, setTelegramChatId] = useState(user?.telegram_chat_id || '')

    // State is initialized on mount. Parent uses key={user.id} to force remount on user change.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsLoading(true)
        const result = await updateProfile(user.id, {
            role,
            sub_role: role === 'maintenance' && subRole ? subRole : null,
            telegram_chat_id: telegramChatId.trim() || null
        })

        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Usuario actualizado con éxito')
            onClose()
        }
    }

    // Effect to sync state when user prop changes (e.g. opening different user)
    // We can use a key in parent, but let's add a quick sync here or just render conditionally.
    // To be safe against stale state:
    // This is a simple implementation; ideally use a form library or key={} in parent.

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar Usuario: ${user?.full_name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Rol
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        value={role}
                        onChange={(e) => {
                            const newRole = e.target.value as UserRole
                            setRole(newRole)
                            if (newRole !== 'maintenance') {
                                setSubRole('')
                            }
                        }}
                    >
                        {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </div>

                {role === 'maintenance' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Sub-rol de Mantenimiento
                        </label>
                        <select
                            required
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={subRole}
                            onChange={(e) => setSubRole(e.target.value as 'handyman' | 'ac-specialist' | '')}
                        >
                            <option value="">Seleccione un sub-rol...</option>
                            <option value="handyman">Handyman (Auxiliar General)</option>
                            <option value="ac-specialist">Especialista de Aire Acondicionado</option>
                        </select>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        ID de Chat de Telegram
                    </label>
                    <Input
                        placeholder="ej. 123456789"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Se utiliza para enviar notificaciones a este usuario a través del bot de Telegram.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
