import type { Database } from '@/types/database'
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
    type LucideIcon,
} from 'lucide-react'

export type TicketCategory = Database['public']['Enums']['ticket_category']
export type TicketPriority = Database['public']['Enums']['ticket_priority']
export type TicketStatus = Database['public']['Enums']['ticket_status']
export type TicketType = Database['public']['Enums']['ticket_type']

interface CategoryConfig {
    label: string
    icon: LucideIcon
    color: string
}

export const CATEGORIES: Record<TicketCategory, CategoryConfig> = {
    ac: {
        label: 'Air Conditioning',
        icon: AirVent,
        color: 'text-cyan-600',
    },
    plumbing: {
        label: 'Plumbing',
        icon: Droplet,
        color: 'text-blue-600',
    },
    wifi: {
        label: 'WiFi / Internet',
        icon: Wifi,
        color: 'text-purple-600',
    },
    electricity: {
        label: 'Electricity',
        icon: Zap,
        color: 'text-yellow-600',
    },
    locks: {
        label: 'Locks & Security',
        icon: Lock,
        color: 'text-red-600',
    },
    furniture: {
        label: 'Furniture',
        icon: Sofa,
        color: 'text-amber-600',
    },
    appliances: {
        label: 'Appliances',
        icon: Home,
        color: 'text-gray-600',
    },
    painting: {
        label: 'Painting',
        icon: Brush,
        color: 'text-pink-600',
    },
    cleaning: {
        label: 'Cleaning',
        icon: Wrench,
        color: 'text-teal-600',
    },
    pest_control: {
        label: 'Pest Control',
        icon: Bug,
        color: 'text-green-600',
    },
    other: {
        label: 'Other',
        icon: Wrench,
        color: 'text-gray-500',
    },
}

export const PRIORITIES: Record<TicketPriority, { label: string; color: string; bgColor: string }> = {
    low: {
        label: 'Low',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
    },
    medium: {
        label: 'Medium',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    high: {
        label: 'High',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    urgent: {
        label: 'Urgent',
        color: 'text-red-700',
        bgColor: 'bg-red-100 dark:bg-red-900',
    },
}

export const STATUSES: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
    reported: {
        label: 'Reported',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    assigned: {
        label: 'Assigned',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    in_progress: {
        label: 'In Progress',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    resolved: {
        label: 'Resolved',
        color: 'text-green-700',
        bgColor: 'bg-green-100 dark:bg-green-900',
    },
    closed: {
        label: 'Closed',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
    },
}

export function getCategoryConfig(category: TicketCategory) {
    return CATEGORIES[category]
}

export function getPriorityConfig(priority: TicketPriority) {
    return PRIORITIES[priority]
}

export function getStatusConfig(status: TicketStatus) {
    return STATUSES[status]
}
