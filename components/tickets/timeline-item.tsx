import { formatDate, formatDateTime } from '@/lib/date-utils'
import type { Database } from '@/types/database'
import {
    Activity,
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    FileEdit,
    Tag,
    User,
    UserPlus,
    DollarSign
} from 'lucide-react'

type AuditLog = Database['public']['Tables']['ticket_audit_logs']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface LogWithActor extends AuditLog {
    actor: Pick<Profile, 'full_name' | 'role'> | null
}

interface TimelineItemProps {
    log: LogWithActor
}

export function TimelineItem({ log }: TimelineItemProps) {
    const getIcon = () => {
        if (log.action === 'created') return <Activity className="w-4 h-4 text-blue-500" />
        if (log.action === 'status_changed') return <CheckCircle2 className="w-4 h-4 text-green-500" />
        if (log.action === 'priority_changed') return <AlertCircle className="w-4 h-4 text-orange-500" />
        if (log.action === 'assigned' || log.action === 'assigned_to_changed') return <UserPlus className="w-4 h-4 text-purple-500" />
        if (log.action === 'category_changed') return <Tag className="w-4 h-4 text-gray-500" />
        if (log.action === 'comment_added') return <FileEdit className="w-4 h-4 text-blue-400" />
        if (log.action === 'evidence_added') return <Tag className="w-4 h-4 text-indigo-500" />
        if (log.action === 'expense_added' || log.action === 'expense_removed') return <DollarSign className="w-4 h-4 text-emerald-600" />
        return <FileEdit className="w-4 h-4 text-gray-400" />
    }

    const formatValue = (val: any) => {
        if (val === null || val === undefined) return 'None'
        if (typeof val === 'object') return JSON.stringify(val)
        return String(val)
    }

    const renderDetails = () => {
        const from = log.from_value as any
        const to = log.to_value as any

        switch (log.action) {
            case 'created':
                return (
                    <span className="text-gray-600 dark:text-gray-400">
                        Created the ticket
                    </span>
                )
            case 'status_changed':
                return (
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        Changed status from <span className="font-medium text-gray-900 dark:text-white capitalize">{from?.status?.replace('_', ' ') || 'None'}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{to?.status?.replace('_', ' ')}</span>
                    </span>
                )
            case 'priority_changed':
                return (
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        Changed priority from <span className="font-medium text-gray-900 dark:text-white capitalize">{from?.priority || 'None'}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{to?.priority}</span>
                    </span>
                )
            case 'assigned':
            case 'assigned_to_changed':
                return (
                    <span className="text-gray-600 dark:text-gray-400">
                        {to?.assigned_to_user_id ? (
                            <>
                                Assigned to <span className="font-medium text-gray-900 dark:text-white">{to.assigned_to_name || 'User'}</span>
                            </>
                        ) : (
                            'Unassigned ticket'
                        )}
                    </span>
                )
            case 'category_changed':
                return (
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        Changed category from <span className="font-medium text-gray-900 dark:text-white capitalize">{from?.category || 'None'}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="font-medium text-gray-900 dark:text-white capitalize">{to?.category}</span>
                    </span>
                )
            case 'description_changed':
                return (
                    <span className="text-gray-600 dark:text-gray-400">
                        Updated the description
                    </span>
                )
            case 'comment_added':
                return (
                    <span className="text-gray-600 dark:text-gray-400">
                        Added a comment: <span className="italic">"{to?.body || ''}"</span>
                    </span>
                )
            case 'evidence_added':
                return (
                    <span className="text-gray-600 dark:text-gray-400">
                        Uploaded evidence ({to?.url ? (
                            <a
                                href={to.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                {to?.kind || 'file'}
                            </a>
                        ) : (
                            to?.kind || 'file'
                        )})
                    </span>
                )
            case 'expense_added':
                return (
                    <span className="text-gray-600 dark:text-gray-400">
                        Added expense: <span className="font-medium text-gray-900 dark:text-white">{to?.description}</span>
                        {' '}-{' '}
                        <span className="font-bold text-green-600">${Number(to?.amount || 0).toFixed(2)}</span>
                        {to?.attachment_url && (
                            <a
                                href={to.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                                (Receipt)
                            </a>
                        )}
                    </span>
                )
            case 'expense_removed':
                return (
                    <span className="text-gray-600 dark:text-gray-400">
                        Removed expense: <span className="line-through">{from?.description}</span>
                        {' '}(${Number(from?.amount || 0).toFixed(2)})
                    </span>
                )
            default:
                return (
                    <span className="text-gray-600 dark:text-gray-400">
                        {log.action.replace(/_/g, ' ')}
                    </span>
                )
        }
    }

    return (
        <div className="flex gap-4">
            <div className="mt-1 relative">
                <div className="absolute top-4 left-2 w-px h-full bg-gray-200 dark:bg-gray-700 -z-10 last:hidden" />
                <div className="w-4 h-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center ring-4 ring-white dark:ring-gray-800">
                    {getIcon()}
                </div>
            </div>
            <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {log.actor?.full_name || 'System'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(log.created_at)}
                    </span>
                </div>
                <div className="text-sm">
                    {renderDetails()}
                </div>
            </div>
        </div>
    )
}
