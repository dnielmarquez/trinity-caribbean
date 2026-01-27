import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Building2 } from 'lucide-react'
import type { Database } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']

interface PropertyWithUnitCount extends Property {
    units: { count: number }[]
    tickets: { priority: string; status: string }[]
}

function UrgentIndicator() {
    return (
        <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
    )
}

export default async function PropertiesPage() {
    const supabase = await createClient()

    const { data: properties, error } = await supabase
        .from('properties')
        .select(`
      *,
      units(count),
      tickets(priority, status)
    `)
        .neq('tickets.status', 'resolved') // Filter out closed/resolved to keep payload smaller? 
        // Actually, filtering nested resources in select string is tricky without !inner or modifying return type.
        // Let's just fetch them and filter in JS for now, assuming volume isn't massive yet. 
        // Or better: Use a separate query for urgent tickets if we want to be clean.
        // But for simplicity in this generated code, let's try just getting them.
        .filter('tickets.priority', 'eq', 'urgent')
        .in('tickets.status', ['reported', 'assigned', 'in_progress'])
        .order('name')
        .returns<PropertyWithUnitCount[]>()

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    Error loading properties: {error.message}
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Properties
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage properties and units
                    </p>
                </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties && properties.length > 0 ? (
                    properties.map((property) => (
                        <Link
                            key={property.id}
                            href={`/properties/${property.id}`}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center relative">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                        {property.tickets && property.tickets.length > 0 && (
                                            <div className="absolute -top-1 -right-1">
                                                <UrgentIndicator />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        {property.name}
                                    </h3>
                                    {property.address && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {property.address}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span>{property.units?.[0]?.count || 0} units</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full p-12 text-center text-gray-500 dark:text-gray-400">
                        No properties found
                    </div>
                )}
            </div>
        </div>
    )
}
