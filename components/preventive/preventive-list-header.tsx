'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreatePreventiveModal } from './create-preventive-modal'
import type { Database } from '@/types/database'

type Property = Database['public']['Tables']['properties']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface PreventiveListHeaderProps {
    properties: Property[]
    profiles: Profile[]
}

export function PreventiveListHeader({ properties, profiles }: PreventiveListHeaderProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    return (
        <>
            <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Create Schedule
            </Button>

            <CreatePreventiveModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                properties={properties}
                profiles={profiles}
            />
        </>
    )
}
