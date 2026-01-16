import { cn } from '@/lib/utils'

interface BadgeProps {
    children: React.ReactNode
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
    const variants = {
        default: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
    }

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                variants[variant],
                className
            )}
        >
            {children}
        </span>
    )
}
