import { getPreventiveTasks } from '@/actions/preventive'
import { getProperties } from '@/actions/properties'
import { getCurrentUser } from '@/lib/rbac'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PreventiveListHeader } from '@/components/preventive/preventive-list-header'
import { PreventiveList } from '@/components/preventive/preventive-list'

interface PreventivePageProps {
    searchParams: Promise<{
        property_id?: string
    }>
}

export default async function PreventivePage({ searchParams }: PreventivePageProps) {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const params = await searchParams
    const supabase = await createClient()

    const [tasksRes, propertiesRes, profilesRes] = await Promise.all([
        getPreventiveTasks({ property_id: params.property_id }),
        getProperties(),
        supabase.from('profiles').select('*').order('full_name') // fetch profiles for assignment
    ])

    const tasks = tasksRes.data
    const properties = propertiesRes.data
    const profiles = profilesRes.data

    if (tasksRes.error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    Error loading preventive tasks: {tasksRes.error}
                </div>
            </div>
        )
    }

    // Handle errors for properties and profiles if they are critical for the page to render
    // For now, we'll assume tasks are the primary critical data.
    // If properties or profiles fail, they will be empty arrays passed to the header.

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        Preventive Maintenance
                    </h1>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Manage recurring schedules for AC and Fumigation
                    </p>
                </div>
                <PreventiveListHeader
                    properties={properties || []}
                    profiles={profiles || []}
                />
            </div>

            <PreventiveList
                tasks={tasks || []}
                properties={properties || []}
                profiles={profiles || []}
                currentPropertyId={params.property_id}
            />
        </div>
    )
}
