import { getCurrentUser } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    if (user.profile.role === 'maintenance') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {children}
            </div>
        )
    }

    return (
        <DashboardShell user={user}>
            {children}
        </DashboardShell>
    )
}
