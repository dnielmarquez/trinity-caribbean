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
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
} from 'lucide-react'
import { useState } from 'react'
import { ROLE_PERMISSIONS } from '@/lib/role-permissions'

interface SidebarProps {
    user: {
        email?: string
        profile: {
            full_name: string
            role: 'reporter' | 'maintenance' | 'sub_director' | 'admin'
        }
    }
    className?: string
    onNavigate?: () => void
}

export default function Sidebar({ user, className, onNavigate }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()
    const permissions = ROLE_PERMISSIONS[user.profile.role]

    const navigation = [
        // ... (I'll keep the navigation array the same, just update usages below)
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            show: user.profile.role !== 'reporter',
        },
        {
            name: 'Tickets',
            href: '/tickets',
            icon: Ticket,
            show: user.profile.role !== 'reporter',
        },
        {
            name: 'Preventive',
            href: '/preventive',
            icon: Calendar,
            show: user.profile.role !== 'reporter',
        },
        {
            name: 'Properties',
            href: '/properties',
            icon: Building2,
            show: user.profile.role !== 'reporter',
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
        housekeeper: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
        reporter: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }

    return (
        <div className={`flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out relative ${className || ''}`}>
            {/* Toggle Button - Hide if on mobile (detected via className usually, or we can assume if passed closing func, controls are different? Actually, let's keep collapse button for desktop, but maybe hide it if in mobile sheet? mobile sheet usually fixed width. I'll hide toggle if className includes w-full or if it's mobile sidebar. 
               For simplicity, I'll render it still, unless I want to explicitly hide it.
            */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-5 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 md:flex hidden"
            >
                {/* Added md:flex hidden to toggle button so it doesn't show in mobile drawer (usually drawer is fixed width) */}
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {/* Logo/Header */}
            <div className={`flex items-center h-16 ${isCollapsed ? 'justify-center px-2' : 'px-6'} border-b border-gray-200 dark:border-gray-700 transition-all duration-300`}>
                <Ticket className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div className={`ml-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        Maintenance
                    </h1>
                </div>
            </div>

            {/* User Info */}
            <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${isCollapsed ? 'flex justify-center' : ''}`}>
                <div className="flex items-center justify-center">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </div>
                    </div>
                    <div className={`ml-3 flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 hidden' : 'w-auto block'}`}>
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
                            title={isCollapsed ? item.name : ''}
                            onClick={() => onNavigate?.()}
                            className={`
                flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }
              `}
                        >
                            <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form action="/logout" method="POST">
                    <button
                        type="submit"
                        title={isCollapsed ? "Sign Out" : ''}
                        className={`flex items-center w-full ${isCollapsed ? 'justify-center px-2' : 'px-4'} py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors`}
                    >
                        <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </form>
            </div>
        </div>
    )
}
