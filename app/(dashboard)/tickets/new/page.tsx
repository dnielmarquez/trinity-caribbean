'use client'

import { createTicket } from '@/actions/create-ticket'
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

    const [formData, setFormData] = useState({
        property_id: '',
        unit_id: '',
        type: 'corrective' as 'corrective' | 'preventive',
        category: '' as TicketCategory | '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        description: '',
        requires_spend: false,
    })

    // Load properties
    useEffect(() => {
        const loadProperties = async () => {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .order('name')

            if (!error && data) {
                setProperties(data)
            }
        }
        loadProperties()
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
            toast.error('Please select a category')
            setLoading(false)
            return
        }

        const result = await createTicket({
            ...formData,
            category: formData.category as any,
            unit_id: formData.unit_id || null,
        })

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            toast.success('Ticket created successfully!')
            router.push(`/tickets/${(result.data as any)!.id}`)
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Create New Ticket
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Report a maintenance issue or damage (target: &lt;30 seconds)
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
                {/* Property & Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Property *
                        </label>
                        <select
                            required
                            value={formData.property_id}
                            onChange={(e) => setFormData({ ...formData, property_id: e.target.value, unit_id: '' })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">Select property...</option>
                            {properties.map((prop) => (
                                <option key={prop.id} value={prop.id}>
                                    {prop.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Unit (optional)
                        </label>
                        <select
                            value={formData.unit_id}
                            onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                            disabled={!formData.property_id}
                        >
                            <option value="">Select unit...</option>
                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type *
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
                            <span className="text-sm text-gray-700 dark:text-gray-300">Corrective (urgent issue)</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="preventive"
                                checked={formData.type === 'preventive'}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Preventive (scheduled)</span>
                        </label>
                    </div>
                </div>

                {/* Category - Icon Grid */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Category *
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
                        Description * (1-2 lines)
                    </label>
                    <textarea
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        placeholder="Briefly describe the issue..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority *
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
                                    {priority}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Requires Spend */}
                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.requires_spend}
                            onChange={(e) => setFormData({ ...formData, requires_spend: e.target.checked })}
                            className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            This issue may require spending/purchases
                        </span>
                    </label>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <Button type="submit" size="lg" disabled={loading} className="flex-1">
                        {loading ? 'Creating...' : 'Create Ticket'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
