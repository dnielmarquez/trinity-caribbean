'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadFile } from '@/actions/storage'

interface FileUploadButtonProps {
    onUploadComplete: (url: string, fileType: 'image' | 'video') => void
    ticketId?: string
    variant?: 'default' | 'outline' | 'ghost' | 'secondary'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    className?: string
    capture?: boolean
    icon?: React.ReactNode
    label?: string
    accept?: string
}

export function FileUploadButton({
    onUploadComplete,
    ticketId,
    variant = 'outline',
    size = 'sm',
    className,
    capture,
    icon,
    label,
    accept = "image/*,video/*"
}: FileUploadButtonProps) {
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        if (ticketId) formData.append('ticketId', ticketId)

        try {
            const result = await uploadFile(formData)

            if (result.error) {
                toast.error(result.error)
            } else if (result.publicUrl) {
                const isVideo = file.type.startsWith('video/')
                onUploadComplete(result.publicUrl, isVideo ? 'video' : 'image')
            }
        } catch (error) {
            toast.error('Failed to upload file')
        } finally {
            setIsUploading(false)
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <div className={className}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={accept}
                capture={capture ? "environment" : undefined}
                onChange={handleFileSelect}
            />
            <Button
                type="button"
                variant={variant}
                size={size}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                title={label || "Add photo or video"}
                className={className || (label ? "w-full h-full flex flex-col items-center justify-center gap-1" : "")}
            >
                {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : icon ? (
                    icon
                ) : (
                    <Camera className="w-5 h-5" />
                )}
                {label && <span className="text-xs font-medium">{label}</span>}
                {!label && <span className="sr-only">Upload media</span>}
            </Button>
        </div>
    )
}
