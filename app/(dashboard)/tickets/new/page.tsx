'use client'


import { createTicket } from '@/actions/create-ticket'
import { FileUploadButton } from '@/components/ui/file-upload-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCategoryConfig, type TicketCategory } from '@/lib/categories'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function NewTicketPage() {
    const router = useRouter()
    const supabase = createClient()

    const [properties, setProperties] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [isInitializing, setIsInitializing] = useState(true)
    const [step, setStep] = useState<1 | 2 | 3>(1)

    const [formData, setFormData] = useState({
        property_id: '',
        unit_id: '',
        type: 'corrective' as 'corrective' | 'preventive',
        category: '' as TicketCategory | '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        description: '',
        initial_comment: '',
        attachments: [] as { url: string; kind: 'image' | 'video' | 'invoice' }[]
    })

    // Load properties and user role
    useEffect(() => {
        const loadInitialData = async () => {
            const [
                { data: propertyData },
                { data: sessionData }
            ] = await Promise.all([
                supabase.from('properties').select('*').order('name'),
                supabase.auth.getUser()
            ])

            if (propertyData) {
                setProperties(propertyData)
            }

            if (sessionData?.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', sessionData.user.id)
                    .single()

                if (profileData) {
                    setUserRole((profileData as any).role)
                }
            }
            setIsInitializing(false)
        }
        loadInitialData()
    }, [supabase])

    // Load units when property changes
    useEffect(() => {
        if (formData.property_id) {
            const loadUnits = async () => {
                const { data, error } = await supabase
                    .from('units')
                    .select('*')
                    .eq('property_id', formData.property_id)
                    .order('name')

                if (!error && data) {
                    setUnits(data)
                }
            }
            loadUnits()
        } else {
            setUnits([])
        }
    }, [formData.property_id, supabase])

    const categories: TicketCategory[] = [
        'ac',
        'plumbing',
        'wifi',
        'electricity',
        'locks',
        'furniture',
        'appliances',
        'painting',
        'cleaning',
        'pest_control',
        'other',
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!formData.category) {
            toast.error('Por favor, seleccione una categoría')
            setLoading(false)
            return
        }

        // Auto-assign Priority for Maintenance
        let finalPriority = formData.priority
        if (userRole === 'maintenance') {
            if (['ac', 'plumbing', 'wifi'].includes(formData.category)) {
                finalPriority = 'urgent'
            } else {
                finalPriority = 'medium'
            }
        }

        const result = await createTicket({
            ...formData,
            priority: finalPriority,
            category: formData.category as any,
            unit_id: formData.unit_id || null,
            attachments: formData.attachments.map(a => ({ url: a.url, kind: a.kind as any }))
        })

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            toast.success('¡Ticket creado con éxito!')
            router.push(`/tickets/${(result.data as any)!.id}`)
        }
    }

    const handleUploadComplete = (url: string, kind: 'image' | 'video') => {
        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, { url, kind: kind as any }]
        }))
    }

    if (isInitializing) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    const priorityLabels = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente'
    }

    // Maintenance User View (Mobile First Wizard)
    if (userRole === 'maintenance') {
        return (
            <div className="p-4 pb-24 max-w-lg mx-auto w-full animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Nuevo Ticket
                        </h1>
                        <Button variant="ghost" size="sm" onClick={() => step > 1 ? setStep((step - 1) as 1 | 2) : router.push('/maintenance')}>
                            Atrás
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Propiedad *
                                    </label>
                                    <select
                                        required
                                        value={formData.property_id}
                                        onChange={(e) => setFormData({ ...formData, property_id: e.target.value, unit_id: '' })}
                                        className="w-full p-4 text-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Seleccionar Propiedad...</option>
                                        {properties.map((prop) => (
                                            <option key={prop.id} value={prop.id}>
                                                {prop.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Unidad (opcional)
                                    </label>
                                    <select
                                        value={formData.unit_id}
                                        onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                                        className="w-full p-4 text-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                                        disabled={!formData.property_id}
                                    >
                                        <option value="">Seleccionar Unidad...</option>
                                        {units.map((unit) => (
                                            <option key={unit.id} value={unit.id}>
                                                {unit.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <Button
                                className="w-full h-14 text-lg font-semibold rounded-xl"
                                size="lg"
                                onClick={() => setStep(2)}
                                disabled={!formData.property_id}
                            >
                                Siguiente Paso
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                    ¿Cuál parece ser el problema?
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {categories.map((category) => {
                                        const config = getCategoryConfig(category)
                                        const Icon = config.icon
                                        const isSelected = formData.category === category

                                        return (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category })}
                                                className={`
                                                    p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 hover:border-blue-500
                                                    ${isSelected
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }
                                                `}
                                            >
                                                <Icon className={`w-8 h-8 ${isSelected ? 'text-blue-600' : config.color}`} />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                                                    {config.label}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            <Button
                                className="w-full h-14 text-lg font-semibold rounded-xl"
                                size="lg"
                                onClick={() => setStep(3)}
                                disabled={!formData.category}
                            >
                                Continuar a los Detalles
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Descripción *
                                </label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    placeholder="Explique el problema..."
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Fotos / Videos
                                </label>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {formData.attachments.map((att, i) => (
                                        <div key={i} className="relative group w-20 h-20 border rounded-xl bg-gray-100 overflow-hidden shadow-sm">
                                            {att.kind === 'image' ? (
                                                <img src={att.url} alt="Attachment" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs bg-gray-200 dark:bg-gray-800 text-gray-500">Video</div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, idx) => idx !== i) }))}
                                                className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <FileUploadButton
                                        onUploadComplete={handleUploadComplete}
                                        variant="outline"
                                        label="Cámara"
                                        capture
                                        accept="image/*"
                                        className="h-20 w-20 rounded-xl border-dashed bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    />
                                    <FileUploadButton
                                        onUploadComplete={handleUploadComplete}
                                        variant="outline"
                                        label="Galería"
                                        className="h-20 w-20 rounded-xl border-dashed bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg"
                                size="lg"
                                disabled={loading || !formData.description}
                            >
                                {loading ? 'Enviando...' : 'Enviar Ticket Final'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        )
    }

    // Default Admin / Non-Maintenance View
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Crear Nuevo Ticket
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Reportar un problema de mantenimiento o daño
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
                {/* Property & Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Propiedad *
                        </label>
                        <select
                            required
                            value={formData.property_id}
                            onChange={(e) => setFormData({ ...formData, property_id: e.target.value, unit_id: '' })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Seleccionar propiedad...</option>
                            {properties.map((prop) => (
                                <option key={prop.id} value={prop.id}>
                                    {prop.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Unidad (opcional)
                        </label>
                        <select
                            value={formData.unit_id}
                            onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                            disabled={!formData.property_id}
                        >
                            <option value="">Seleccionar unidad...</option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Type - Hidden for maintenance users, defaults to corrective */}
                {userRole !== 'maintenance' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo *
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="corrective"
                                    checked={formData.type === 'corrective'}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Correctivo (problema urgente)</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="preventive"
                                    checked={formData.type === 'preventive'}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Preventivo (programado)</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Category - Icon Grid */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Categoría *
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {categories.map((category) => {
                            const config = getCategoryConfig(category)
                            const Icon = config.icon
                            const isSelected = formData.category === category

                            return (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category })}
                                    className={`
                    p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 hover:border-blue-500
                    ${isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700'
                                        }
                  `}
                                >
                                    <Icon className={`w-8 h-8 ${isSelected ? 'text-blue-600' : config.color}`} />
                                    <span className="text-xs font-medium text-gray-900 dark:text-white text-center">
                                        {config.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción * (1-2 líneas)
                    </label>
                    <textarea
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        placeholder="Describa brevemente el problema..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Initial Comment */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Comentario Inicial y Evidencia (opcional)
                    </label>
                    <div className="space-y-3">
                        <textarea
                            value={formData.initial_comment}
                            onChange={(e) => setFormData({ ...formData, initial_comment: e.target.value })}
                            rows={2}
                            placeholder="Agregue detalles o notas adicionales..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />

                        <div className="flex flex-wrap gap-2 items-center">
                            <FileUploadButton
                                onUploadComplete={handleUploadComplete}
                                variant="outline"
                                size="sm"
                                label="Cámara"
                                capture
                                accept="image/*"
                            />
                            <FileUploadButton
                                onUploadComplete={handleUploadComplete}
                                variant="outline"
                                size="sm"
                                label="Galería"
                            />
                            {formData.attachments.map((att, i) => (
                                <div key={i} className="relative group w-16 h-16 border rounded bg-gray-100 overflow-hidden">
                                    {att.kind === 'image' ? (
                                        <img src={att.url} alt="Attachment" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs">Video</div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, idx) => idx !== i) }))}
                                        className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prioridad *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => {
                            const isSelected = formData.priority === priority
                            const colors = {
                                low: 'border-gray-300 text-gray-700',
                                medium: 'border-blue-300 text-blue-700',
                                high: 'border-orange-300 text-orange-700',
                                urgent: 'border-red-300 text-red-700',
                            }

                            return (
                                <button
                                    key={priority}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority })}
                                    className={`
                    px-4 py-3 rounded-lg border-2 font-medium capitalize transition-all
                    ${isSelected
                                            ? `${colors[priority]} bg-${priority === 'urgent' ? 'red' : priority === 'high' ? 'orange' : priority === 'medium' ? 'blue' : 'gray'}-50`
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                        }
                  `}
                                >
                                    {priorityLabels[priority]}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Requires Spend */}


                {/* Submit */}
                <div className="flex gap-3">
                    <Button type="submit" size="lg" disabled={loading} className="flex-1">
                        {loading ? 'Creando...' : 'Crear Ticket'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => router.back()}
                    >
                        Cancelar
                    </Button>
                </div>
            </form>
        </div>
    )
}
