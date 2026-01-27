'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, ChevronDown, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Property {
    id: string
    name: string
}

interface TopBarProps {
    onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [properties, setProperties] = useState<Property[]>([])
    const currentPropertyId = searchParams.get('property_id') || 'all'

    useEffect(() => {
        const fetchProperties = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('properties')
                .select('id, name')
                .order('name')

            if (data) {
                setProperties(data)
            }
        }
        fetchProperties()
    }, [])

    const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'all') {
            params.set('property_id', value)
        } else {
            params.delete('property_id')
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3 md:gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Building2 className="w-5 h-5" />
                    <span className="text-sm font-medium hidden sm:inline">Property Context:</span>
                </div>
                <div className="relative">
                    <select
                        value={currentPropertyId}
                        onChange={handlePropertyChange}
                        className={cn(
                            "appearance-none w-[200px] h-9 pl-3 pr-8 text-sm",
                            "bg-white dark:bg-gray-900",
                            "border border-gray-300 dark:border-gray-700 rounded-md",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                            "text-gray-900 dark:text-gray-100",
                            "cursor-pointer"
                        )}
                    >
                        <option value="all">All Properties</option>
                        {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                                {property.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
                </div>
            </div>
        </div>
    )
}
