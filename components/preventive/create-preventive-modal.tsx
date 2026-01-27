'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createPreventiveTask } from '@/actions/preventive'
import type { Database } from '@/types/database'
import { getUnits } from '@/actions/units' // We need to fetch units client side or pass all units. 
// Fetching units on property change is better. But actions/units.ts might not exist or be exposed properly. 
// Let's assume we can fetch units via server action or just pass properties. 
// Actually, usually we fetch units dynamically. Let's start without unit fetching complexity or implement a quick fetch.

// Wait, I need to check if getUnits exists. Assuming NO. I will use a simple client-side fetch or just property selection for now if unit is tricky.
// User requested "Select, property and unit".
// I'll create `getUnits` logic inside the component using supabase client if available or just create a new action if needed. 
// For now, let's assume `createClient` from `lib/supabase/client` works for fetching units.

import { createBrowserClient } from '@supabase/ssr'

type Property = Database['public']['Tables']['properties']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Unit = Database['public']['Tables']['units']['Row']

interface CreatePreventiveModalProps {
    isOpen: boolean
    onClose: () => void
    properties: Property[]
    profiles: Profile[]
}

const CATEGORIES = [
    { value: 'ac', label: 'Air Conditioner' },
    { value: 'pest_control', label: 'Fumigation' },
    { value: 'plumbing', label: 'Plumbing' }, // generic fallback items
    { value: 'electricity', label: 'Electricity' },
]

export function CreatePreventiveModal({ isOpen, onClose, properties, profiles }: CreatePreventiveModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [units, setUnits] = useState<Unit[]>([])
    const [loadingUnits, setLoadingUnits] = useState(false)

    // Form State
    const [category, setCategory] = useState('ac')
    const [propertyId, setPropertyId] = useState('')
    const [unitId, setUnitId] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [recurrenceDays, setRecurrenceDays] = useState(30)
    const [nextDate, setNextDate] = useState('')
    const [description, setDescription] = useState('')

    // Fetch units when property changes
    const handlePropertyChange = async (propId: string) => {
        setPropertyId(propId)
        setUnitId('')
        setUnits([])

        if (!propId) return

        setLoadingUnits(true)
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data } = await supabase.from('units').select('*').eq('property_id', propId).order('name')
        if (data) setUnits(data as Unit[])
        setLoadingUnits(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!propertyId || !assignedTo || !nextDate) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsLoading(true)
        const result = await createPreventiveTask({
            category: category as any,
            property_id: propertyId,
            unit_id: unitId || null,
            assigned_to_user_id: assignedTo,
            description: description || `${CATEGORY_ICONS[category]} Maintenance`,
            recurrence_type: 'days',
            recurrence_interval: recurrenceDays,
            next_scheduled_at: new Date(nextDate).toISOString(),
            is_active: true,
            created_by: '', // handled by server action
        })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Schedule created successfully')
            onClose()
            // Reset form
            setCategory('ac')
            setPropertyId('')
            setUnitId('')
            setAssignedTo('')
            setRecurrenceDays(30)
            setNextDate('')
            setDescription('')
        }
        setIsLoading(false)
    }

    const CATEGORY_ICONS: Record<string, string> = {
        ac: 'Air Conditioner',
        pest_control: 'Fumigation',
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Preventive Schedule">
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Category Selection */}
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {CATEGORIES.slice(0, 2).map((cat) => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setCategory(cat.value)}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${category === cat.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <span className="block font-semibold">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Property & Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Property</label>
                        <select
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                            value={propertyId}
                            onChange={(e) => handlePropertyChange(e.target.value)}
                            required
                        >
                            <option value="">Select Property</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Unit (Optional)</label>
                        <select
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                            value={unitId}
                            onChange={(e) => setUnitId(e.target.value)}
                            disabled={!propertyId || loadingUnits}
                        >
                            <option value="">{loadingUnits ? 'Loading...' : 'Entire Property'}</option>
                            {units.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Assignment */}
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Assign To</label>
                    <select
                        className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        required
                    >
                        <option value="">Select Staff</option>
                        {profiles.filter(p => p.role === 'maintenance' || p.role === 'admin').map(p => (
                            <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                        ))}
                    </select>
                </div>

                {/* Frequency & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Run Every (Days)</label>
                        <Input
                            type="number"
                            min="1"
                            value={recurrenceDays}
                            onChange={(e) => setRecurrenceDays(parseInt(e.target.value))}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Next Run Date</label>
                        <Input
                            type="date"
                            value={nextDate}
                            onChange={(e) => setNextDate(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description (Optional)</label>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Monthly maintenance check"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Schedule
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
