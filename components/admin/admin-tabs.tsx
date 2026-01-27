'use client'

import { useState } from 'react'
import { Users, Building, DoorOpen } from 'lucide-react'
import { PropertyManagement } from './property-management'
import { UnitManagement } from './unit-management'
import { UsersTab } from './users-tab'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Property = Database['public']['Tables']['properties']['Row']
type Unit = Database['public']['Tables']['units']['Row'] & {
    property?: { name: string } | null
}

interface AdminTabsProps {
    profiles: Profile[]
    properties: Property[]
    units: Unit[]
}

export function AdminTabs({ profiles, properties, units }: AdminTabsProps) {
    const [activeTab, setActiveTab] = useState<'users' | 'properties' | 'units'>('users')

    const tabs = [
        { id: 'users', label: 'Users & Roles', icon: Users },
        { id: 'properties', label: 'Properties', icon: Building },
        { id: 'units', label: 'Units', icon: DoorOpen },
    ] as const

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'users' && (
                    <UsersTab profiles={profiles} />
                )}

                {activeTab === 'properties' && (
                    <PropertyManagement properties={properties} />
                )}

                {activeTab === 'units' && (
                    <UnitManagement units={units} properties={properties} />
                )}
            </div>
        </div>
    )
}
