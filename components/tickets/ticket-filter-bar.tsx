'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CATEGORIES, STATUSES, PRIORITIES } from '@/lib/categories'
import type { Database } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']

interface TicketFilterBarProps {
    properties: Property[]
}

export function TicketFilterBar({ properties }: TicketFilterBarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [propertyId, setPropertyId] = useState(searchParams.get('property_id') || '')
    const [category, setCategory] = useState(searchParams.get('category') || '')
    const [status, setStatus] = useState(searchParams.get('status') || '')
    const [priority, setPriority] = useState(searchParams.get('priority') || '')

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
            property_id: propertyId || null,
            category: category || null,
            status: status || null,
            priority: priority || null,
        })
        router.push(`${pathname}?${query}`)
    }

    const clearFilters = () => {
        setSearch('')
        setPropertyId('')
        setCategory('')
        setStatus('')
        setPriority('')
        router.push(pathname)
    }

    // Effect to handle search debouncing or just apply on Enter
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            applyFilters()
        }
    }

    // Sync state with URL if changed elsewhere (e.g. back button)
    useEffect(() => {
        setSearch(searchParams.get('search') || '')
        setPropertyId(searchParams.get('property_id') || '')
        setCategory(searchParams.get('category') || '')
        setStatus(searchParams.get('status') || '')
        setPriority(searchParams.get('priority') || '')
    }, [searchParams])

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search tickets, properties..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-shrink-0">
                    {/* Property */}
                    <select
                        className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                        value={propertyId}
                        onChange={(e) => setPropertyId(e.target.value)}
                    >
                        <option value="">All Properties</option>
                        {properties.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {/* Category */}
                    <select
                        className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {Object.entries(CATEGORIES).map(([id, config]) => (
                            <option key={id} value={id}>{config.label}</option>
                        ))}
                    </select>

                    {/* Status */}
                    <select
                        className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {Object.entries(STATUSES).map(([id, config]) => (
                            <option key={id} value={id}>{config.label}</option>
                        ))}
                    </select>

                    {/* Priority */}
                    <select
                        className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-200"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                    >
                        <option value="">All Priorities</option>
                        {Object.entries(PRIORITIES).map(([id, config]) => (
                            <option key={id} value={id}>{config.label}</option>
                        ))}
                    </select>
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
