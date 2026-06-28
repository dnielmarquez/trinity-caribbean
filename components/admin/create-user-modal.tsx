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
        subRole: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const form = new FormData()
        form.append('email', formData.email)
        form.append('password', formData.password)
        form.append('fullName', formData.fullName)
        form.append('role', formData.role)
        form.append('subRole', formData.role === 'maintenance' ? formData.subRole : '')

        const result = await createUser(form)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Usuario creado con éxito')
            onClose()
            setFormData({
                email: '',
                password: '',
                fullName: '',
                role: 'reporter',
                subRole: '',
            })
        }
        setIsLoading(false)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Usuario">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                    <Input
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Juan Pérez"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                    <Input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="juan@example.com"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
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
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value, subRole: '' })}
                    >
                        <option value="reporter">Reportero (Inquilino/Personal)</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="housekeeper">Camarista/Limpieza</option>
                        <option value="sub_director">Subdirector</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>

                {formData.role === 'maintenance' && (
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sub-rol de Mantenimiento</label>
                        <select
                            required
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            value={formData.subRole}
                            onChange={(e) => setFormData({ ...formData, subRole: e.target.value })}
                        >
                            <option value="">Seleccione un sub-rol...</option>
                            <option value="handyman">Handyman (Auxiliar General)</option>
                            <option value="ac-specialist">Especialista de Aire Acondicionado</option>
                        </select>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Crear Usuario
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
