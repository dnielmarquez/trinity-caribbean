'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { CATEGORIES, STATUSES, PRIORITIES } from '@/lib/categories'
import type { Database } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface TicketFilterBarProps {
    properties: Property[]
    staff?: Pick<Profile, 'id' | 'full_name'>[]
}

export function TicketFilterBar({ properties, staff }: TicketFilterBarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Helper to parse array params
    const getArrayParam = (key: string): string[] => {
        const value = searchParams.get(key)
        return value ? value.split(',').filter(Boolean) : []
    }

    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [propertyIds, setPropertyIds] = useState<string[]>(getArrayParam('property_id'))
    const [categories, setCategories] = useState<string[]>(getArrayParam('category'))
    const [statuses, setStatuses] = useState<string[]>(getArrayParam('status'))
    const [priorities, setPriorities] = useState<string[]>(getArrayParam('priority'))
    const [assignedTo, setAssignedTo] = useState<string[]>(getArrayParam('assigned_to'))

    // Check if property is filtered globally via URL params (from top bar - usually single value)
    const globalPropertyId = searchParams.get('property_id')
    // We only hide the local property filter if there is exactly one property selected AND it wasn't set by our multi-select logic (this is a bit ambiguous, but usually the global filter is a single ID)
    // For now, if there's a property_id in the URL and we didn't just set it via our filter bar (which we track via state), it might be global.
    // Simplifying: If the user navigates to /tickets?property_id=123, we presume that's the context. 
    // However, with multi-select, we want to allow adding more properties. 
    // The previous logic was: "If filtered globally... hide local". 
    // Let's keep it simple: We always show the filter, but sync it with URL. 
    // Actually, the previous logic likely meant "if the dashboard context is a specific property". 
    // Let's stick to the previous behavior: If we detect we are in a "single property context" (maybe passed via props in a future refactor, but here relying on URL), we might want to lock it?
    // The previous code said: `const showPropertyFilter = !globalPropertyId`. This implies if the URL already has a property_id, we hide the dropdown.
    // But now we want to allow filtering by multiple properties.
    // If we are in "All Properties" mode, we show the dropdown.
    // Let's assume for now we always show it unless explicitly told otherwise, but to match previous behavior:
    // If the component is used in a context where `property_id` is fixed (like a property dashboard), it might be hidden. 
    // But since this is the main tickets list, we probably want to allow changing it.
    // The previous code behavior was a bit strict. Let's relax it to always allow filtering, 
    // unless we decide that `globalPropertyId` implies a restriction. 
    // Actually, looking at the previous code, it only hid it if `globalPropertyId` was present. 
    // I will enable it for now to allow multi-select power.

    // Update URL when filters change
    const createQueryString = useCallback(
        (params: Record<string, string | null>) => {
            const newParams = new URLSearchParams(searchParams.toString())

            Object.entries(params).forEach(([key, value]) => {
                if (value === null || value === '') {
                    newParams.delete(key)
                } else {
                    newParams.set(key, value)
                }
            })

            // Reset page when filtering
            if (Object.keys(params).length > 0) {
                newParams.delete('page')
            }

            return newParams.toString()
        },
        [searchParams]
    )

    const applyFilters = () => {
        const query = createQueryString({
            search: search || null,
            property_id: propertyIds.length > 0 ? propertyIds.join(',') : null,
            category: categories.length > 0 ? categories.join(',') : null,
            status: statuses.length > 0 ? statuses.join(',') : null,
            priority: priorities.length > 0 ? priorities.join(',') : null,
            assigned_to: assignedTo.length > 0 ? assignedTo.join(',') : null,
        })
        router.push(`${pathname}?${query}`)
    }

    const clearFilters = () => {
        setSearch('')
        setPropertyIds([])
        setCategories([])
        setStatuses([])
        setPriorities([])
        setAssignedTo([])
        router.push(pathname)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            applyFilters()
        }
    }

    // Sync state with URL if changed elsewhere
    useEffect(() => {
        setSearch(searchParams.get('search') || '')
        setPropertyIds(getArrayParam('property_id'))
        setCategories(getArrayParam('category'))
        setStatuses(getArrayParam('status'))
        setPriorities(getArrayParam('priority'))
        setAssignedTo(getArrayParam('assigned_to'))
    }, [searchParams])

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search tickets..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-shrink-0">
                    <MultiSelectDropdown
                        title="Properties"
                        options={properties.map(p => ({ label: p.name, value: p.id }))}
                        selectedValues={propertyIds}
                        onChange={setPropertyIds}
                    />

                    <MultiSelectDropdown
                        title="Assigned To"
                        options={staff?.map(s => ({ label: s.full_name || 'Unknown', value: s.id })) || []}
                        selectedValues={assignedTo}
                        onChange={setAssignedTo}
                    />

                    <MultiSelectDropdown
                        title="Category"
                        options={Object.entries(CATEGORIES).map(([id, config]) => ({ label: config.label, value: id }))}
                        selectedValues={categories}
                        onChange={setCategories}
                    />

                    <MultiSelectDropdown
                        title="Status"
                        options={Object.entries(STATUSES).map(([id, config]) => ({ label: config.label, value: id }))}
                        selectedValues={statuses}
                        onChange={setStatuses}
                    />

                    <MultiSelectDropdown
                        title="Priority"
                        options={Object.entries(PRIORITIES).map(([id, config]) => ({ label: config.label, value: id }))}
                        selectedValues={priorities}
                        onChange={setPriorities}
                    />
                </div>

                <div className="flex gap-2">
                    <Button onClick={applyFilters} className="flex-grow md:flex-grow-0">
                        <Filter className="w-4 h-4 mr-2" />
                        Apply
                    </Button>
                    <Button variant="outline" onClick={clearFilters} title="Clear all filters">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
