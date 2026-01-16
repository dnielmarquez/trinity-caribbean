'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Ticket,
    Building2,
    Settings,
    LogOut,
    Calendar,
    Shield,
    User,
} from 'lucide-react'
import { ROLE_PERMISSIONS } from '@/lib/role-permissions'

interface SidebarProps {
    user: {
        email?: string
        profile: {
            full_name: string
            role: 'reporter' | 'maintenance' | 'sub_director' | 'admin'
        }
    }
}

export default function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()
    const permissions = ROLE_PERMISSIONS[user.profile.role]

    const navigation = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            show: true,
        },
        {
            name: 'Tickets',
            href: '/tickets',
            icon: Ticket,
            show: true,
        },
        {
            name: 'Properties',
            href: '/properties',
            icon: Building2,
            show: true,
        },
        {
            name: 'Preventive',
            href: '/preventive',
            icon: Calendar,
            show: permissions.canViewAnalytics,
        },
        {
            name: 'Admin',
            href: '/admin',
            icon: Shield,
            show: permissions.canManageUsers,
        },
    ].filter((item) => item.show)

    const roleColors = {
        admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        sub_director: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        maintenance: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        reporter: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }

    return (
        <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Logo/Header */}
            <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
                <Ticket className="w-8 h-8 text-blue-600" />
                <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                    Maintenance
                </h1>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user.profile.full_name}
                        </p>
                        <p className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${roleColors[user.profile.role]}`}>
                            {user.profile.role.replace('_', ' ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }
              `}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form action="/logout" method="POST">
                    <button
                        type="submit"
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    )
}
