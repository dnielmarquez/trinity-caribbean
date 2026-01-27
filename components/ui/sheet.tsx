'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
    isOpen: boolean
    onClose: () => void
    side?: 'left' | 'right'
    children: React.ReactNode
    className?: string
}

export function Sheet({ isOpen, onClose, side = 'left', children, className }: SheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm transition-opacity">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />
            <div
                ref={sheetRef}
                className={cn(
                    "relative max-w-xs w-full bg-white dark:bg-gray-800 shadow-xl overflow-y-auto h-full flex flex-col pt-5 pb-4 ease-in-out duration-300 transform transition-transform",
                    side === 'left' ? "animate-in slide-in-from-left" : "animate-in slide-in-from-right",
                    className
                )}
            >
                <div className="absolute top-0 right-0 pt-2 pr-2">
                    <button
                        onClick={onClose}
                        className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                        <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}
