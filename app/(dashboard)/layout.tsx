import { getCurrentUser } from '@/lib/rbac'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar user={user} />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
