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
        label: 'Aire Acondicionado',
        icon: AirVent,
        color: 'text-cyan-600',
    },
    plumbing: {
        label: 'Plomería',
        icon: Droplet,
        color: 'text-blue-600',
    },
    wifi: {
        label: 'WiFi / Internet',
        icon: Wifi,
        color: 'text-purple-600',
    },
    electricity: {
        label: 'Electricidad',
        icon: Zap,
        color: 'text-yellow-600',
    },
    locks: {
        label: 'Cerraduras y Seguridad',
        icon: Lock,
        color: 'text-red-600',
    },
    furniture: {
        label: 'Muebles',
        icon: Sofa,
        color: 'text-amber-600',
    },
    appliances: {
        label: 'Electrodomésticos',
        icon: Home,
        color: 'text-gray-600',
    },
    painting: {
        label: 'Pintura',
        icon: Brush,
        color: 'text-pink-600',
    },
    cleaning: {
        label: 'Limpieza',
        icon: Wrench,
        color: 'text-teal-600',
    },
    pest_control: {
        label: 'Control de Plagas',
        icon: Bug,
        color: 'text-green-600',
    },
    other: {
        label: 'Otro',
        icon: Wrench,
        color: 'text-gray-500',
    },
}

export const PRIORITIES: Record<TicketPriority, { label: string; color: string; bgColor: string }> = {
    low: {
        label: 'Baja',
        color: 'text-gray-700',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
    },
    medium: {
        label: 'Media',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    high: {
        label: 'Alta',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    urgent: {
        label: 'Urgente',
        color: 'text-red-700',
        bgColor: 'bg-red-100 dark:bg-red-900',
    },
}

export const STATUSES: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
    reported: {
        label: 'Reportado',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100 dark:bg-purple-900',
    },
    assigned: {
        label: 'Asignado',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    in_progress: {
        label: 'En Progreso',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    resolved: {
        label: 'Resuelto',
        color: 'text-green-700',
        bgColor: 'bg-green-100 dark:bg-green-900',
    },
    closed: {
        label: 'Cerrado',
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
