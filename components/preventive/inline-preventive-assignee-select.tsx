'use client'

import { useState } from 'react'
import { Database } from '@/types/database'
import { updatePreventiveTask } from '@/actions/preventive'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { cn } from '@/lib/utils'
import { User, UserPlus } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

interface InlinePreventiveAssigneeSelectProps {
    taskId: string
    assignedTo: Pick<Profile, 'id' | 'full_name'> | null
    staff: Pick<Profile, 'id' | 'full_name' | 'role'>[]
}

export function InlinePreventiveAssigneeSelect({ taskId, assignedTo, staff }: InlinePreventiveAssigneeSelectProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    const handleAssign = async (userId: string | null) => {
        if (assignedTo?.id === userId) return

        setIsUpdating(true)
        try {
            const result = await updatePreventiveTask(taskId, { assigned_to_user_id: userId })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Assignee updated')
            }
        } catch (error) {
            toast.error('Failed to update assignee')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={cn("cursor-pointer transition-opacity flex items-center gap-2 group", isUpdating && "opacity-50 pointer-events-none")}>
                    {assignedTo ? (
                        <>
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs font-medium">
                                {assignedTo.full_name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:underline decoration-dashed underline-offset-4">
                                {assignedTo.full_name}
                            </span>
                        </>
                    ) : (
                        <div className="flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mr-2">
                                <UserPlus className="w-3 h-3" />
                            </div>
                            <span className="text-sm italic group-hover:underline decoration-dashed underline-offset-4">Assign</span>
                        </div>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto w-56">
                <DropdownMenuItem onClick={() => handleAssign(null)} className="cursor-pointer text-red-600 focus:text-red-700">
                    Unassign
                </DropdownMenuItem>
                {staff.map((user) => (
                    <DropdownMenuItem
                        key={user.id}
                        onClick={() => handleAssign(user.id)}
                        className="cursor-pointer"
                    >
                        {user.full_name}
                        <span className="ml-2 text-xs text-gray-500">({user.role})</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
