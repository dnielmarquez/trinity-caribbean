'use client'

import { useState, useMemo } from 'react'
import {
    AirVent,
    Droplet,
    Wifi,
    Zap,
    Lock,
    Sofa,
    Home,
    Brush,
    Bug,
    Wrench,
    Clock,
    User as UserIcon,
    Building,
    Calendar,
    Filter,
    MoreHorizontal,
    Trash2,
    StopCircle,
    PlayCircle
} from 'lucide-react'
import type { Database } from '@/types/database'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { updatePreventiveTask, deletePreventiveTask } from '@/actions/preventive'
import { toast } from 'sonner'

import { InlinePreventiveAssigneeSelect } from './inline-preventive-assignee-select'

type PreventiveTask = Database['public']['Tables']['preventive_tasks']['Row'] & {
    property?: { name: string } | null
    unit?: { name: string } | null
    assigned_to?: { id: string, full_name: string } | null
}

type Property = Database['public']['Tables']['properties']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

const CATEGORY_ICONS: Record<string, any> = {
    ac: AirVent,
    plumbing: Droplet,
    wifi: Wifi,
    electricity: Zap,
    locks: Lock,
    furniture: Sofa,
    appliances: Home,
    painting: Brush,
    cleaning: Wrench,
    pest_control: Bug,
    other: Wrench,
}

interface PreventiveListProps {
    tasks: PreventiveTask[]
    properties: Property[] // Used for the property filter if enabled
    profiles: Profile[]
    currentPropertyId?: string
}

export function PreventiveList({ tasks, properties, profiles, currentPropertyId }: PreventiveListProps) {
    const [selectedPropertyId, setSelectedPropertyId] = useState(currentPropertyId || 'all')
    const [selectedUnitName, setSelectedUnitName] = useState('all')

    // Update internal state if prop changes (e.g. navigation)
    if (currentPropertyId && selectedPropertyId !== currentPropertyId) {
        setSelectedPropertyId(currentPropertyId)
    }

    const handleStatusToggle = async (task: PreventiveTask) => {
        const newStatus = !task.is_active
        const result = await updatePreventiveTask(task.id, { is_active: newStatus })

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Schedule ${newStatus ? 'resumed' : 'paused'}`)
        }
    }

    const handleDelete = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) return

        const result = await deletePreventiveTask(taskId)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Schedule deleted')
        }
    }

    // Extract unique units for the filter based on current tasks
    // (This works well because we only want to filter by units that actually have tasks)
    const availableUnits = useMemo(() => {
        const units = new Set<string>()
        tasks.forEach(task => {
            if (task.unit?.name) {
                // If filtering by property, only show units for that property
                if (selectedPropertyId === 'all' || task.property_id === selectedPropertyId) {
                    units.add(task.unit.name)
                }
            }
        })
        return Array.from(units).sort()
    }, [tasks, selectedPropertyId])

    const filteredTasks = tasks.filter(task => {
        const matchesProperty = selectedPropertyId === 'all' || task.property_id === selectedPropertyId
        const matchesUnit = selectedUnitName === 'all' || task.unit?.name === selectedUnitName
        return matchesProperty && matchesUnit
    })

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No schedules found</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Create a new preventive maintenance schedule to get started.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters:</span>
                </div>

                {/* Property Filter - Show only if not locked to a specific property via URL */}
                {!currentPropertyId && (
                    <select
                        className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        value={selectedPropertyId}
                        onChange={(e) => {
                            setSelectedPropertyId(e.target.value)
                            setSelectedUnitName('all') // Reset unit when property changes
                        }}
                    >
                        <option value="all">All Properties</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                )}

                {/* Unit Filter */}
                <select
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    value={selectedUnitName}
                    onChange={(e) => setSelectedUnitName(e.target.value)}
                    disabled={availableUnits.length === 0}
                >
                    <option value="all">All Units</option>
                    {availableUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Property</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recurrence</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Next Due</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned To</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No schedules match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => {
                                    const Icon = CATEGORY_ICONS[task.category] || Wrench
                                    return (
                                        <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                                                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                        {task.category.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                                                        {task.property?.name || 'Unknown'}
                                                    </span>
                                                    {task.unit && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            Unit {task.unit.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={task.description}>
                                                    {task.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>Every {task.recurrence_interval} {task.recurrence_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {task.next_scheduled_at ? new Date(task.next_scheduled_at).toLocaleDateString() : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <InlinePreventiveAssigneeSelect
                                                    taskId={task.id}
                                                    assignedTo={task.assigned_to ? { id: task.assigned_to_user_id || '', full_name: task.assigned_to.full_name } : null}
                                                    staff={profiles.filter(p => p.role === 'maintenance' || p.role === 'admin')}
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${task.is_active
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                    {task.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleStatusToggle(task)}>
                                                            {task.is_active ? (
                                                                <>
                                                                    <StopCircle className="mr-2 h-4 w-4" />
                                                                    Pause Schedule
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <PlayCircle className="mr-2 h-4 w-4" />
                                                                    Resume Schedule
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(task.id)}
                                                            className="text-red-600 dark:text-red-400"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
