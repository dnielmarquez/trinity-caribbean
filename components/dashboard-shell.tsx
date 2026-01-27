'use client'

import { useState } from 'react'
import Sidebar from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { Sheet } from '@/components/ui/sheet'

interface DashboardShellProps {
    user: any
    children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Desktop Sidebar - Hidden on Mobile */}
            <Sidebar user={user} className="hidden md:flex" />

            {/* Mobile Sidebar (Sheet) */}
            <Sheet
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                side="left"
            >
                <Sidebar
                    user={user}
                    className="w-full border-none shadow-none"
                    onNavigate={() => setIsMobileMenuOpen(false)}
                />
            </Sheet>

            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
