'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export function CleaningLogoutButton() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Sign Out"
            >
                <LogOut className="w-6 h-6" />
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Confirm Logout"
            >
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-400">
                        Are you sure you want to log out? Any unsaved progress will be lost.
                    </p>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <form
                            action="/logout"
                            method="POST"
                            onSubmit={() => setIsLoading(true)}
                        >
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Logging out...
                                    </>
                                ) : (
                                    'Logout'
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </Modal>
        </>
    )
}
