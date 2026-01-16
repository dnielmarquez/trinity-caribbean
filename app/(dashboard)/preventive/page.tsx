import { getCurrentUser } from '@/lib/rbac'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import type { Database } from '@/types/database'

type PreventiveTask = Database['public']['Tables']['preventive_tasks']['Row'] & {
    property: { name: string } | null
    unit: { name: string } | null
}

export default async function PreventivePage() {
    const user = await getCurrentUser()
    const supabase = await createClient()

    const { data: tasks } = await supabase
        .from('preventive_tasks')
        .select(`
      *,
      property:properties(name),
      unit:units(name)
    `)
        .eq('is_active', true)
        .order('next_scheduled_at')
        .returns<PreventiveTask[]>()

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Preventive Maintenance
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage recurring maintenance tasks (scheduler-ready)
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    ℹ️ This section displays the preventive maintenance foundation. Use the "Generate Ticket" button
                    to manually create tickets from recurring tasks. Future versions can add automated scheduling.
                </p>
            </div>

            {/* Preventive Tasks */}
            {tasks && tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {task.category.replace('_', ' ').toUpperCase()}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {task.property?.name} {task.unit?.name && `- ${task.unit.name}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                {task.description}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Every {task.recurrence_interval} {task.recurrence_type}
                                </div>
                                <Button size="sm" variant="outline">
                                    Generate Ticket
                                </Button>
                            </div>

                            {task.last_generated_at && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Last generated: {new Date(task.last_generated_at).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        No preventive maintenance tasks configured
                    </p>
                </div>
            )}
        </div>
    )
}
