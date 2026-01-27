'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Send, Paperclip } from 'lucide-react'
import { addComment } from '@/actions/comments'
import { saveAttachment } from '@/actions/storage'
import { FileUploadButton } from '@/components/ui/file-upload-button'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Ticket = Database['public']['Tables']['tickets']['Row']

interface TicketCommentFormProps {
    ticketId: string
}

export function TicketCommentForm({ ticketId }: TicketCommentFormProps) {
    const router = useRouter()

    // Comment states
    const [newComment, setNewComment] = useState('')
    const [isAddingComment, setIsAddingComment] = useState(false)
    const [draftAttachments, setDraftAttachments] = useState<{ url: string; kind: 'image' | 'video' }[]>([])

    const handleAddComment = async (e?: React.FormEvent) => {
        e?.preventDefault()

        if (!newComment.trim() && draftAttachments.length === 0) return

        setIsAddingComment(true)

        let commentBody = newComment.trim()
        if (draftAttachments.length > 0) {
            commentBody += '\n\n'
            draftAttachments.forEach(att => {
                const markdown = att.kind === 'image' ? `![Image](${att.url})` : `[Video](${att.url})`
                commentBody += markdown + '\n'
            })
        }

        const result = await addComment(ticketId, commentBody)

        if (result.error) {
            toast.error(result.error)
        } else if (result.data) {

            // Save draft attachments to database now that comment is created
            if (draftAttachments.length > 0) {
                await Promise.all(
                    draftAttachments.map(att => saveAttachment(ticketId, att.url, att.kind))
                )
            }

            toast.success('Comment added')
            setNewComment('')
            setDraftAttachments([])
            router.refresh() // Refresh server components to show new comment
        }
        setIsAddingComment(false)
    }

    const handleUploadComplete = (url: string, kind: 'image' | 'video') => {
        // Just add to drafts, do NOT save to database yet
        setDraftAttachments(prev => [...prev, { url, kind }])
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add Comment</h3>

            {/* Draft Attachments Preview */}
            {draftAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {draftAttachments.map((att, i) => (
                        <div key={i} className="relative group w-16 h-16 border rounded bg-gray-100 overflow-hidden">
                            {att.kind === 'image' ? (
                                <img src={att.url} alt="Attachment" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">Video</div>
                            )}
                            <button
                                type="button"
                                onClick={() => setDraftAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleAddComment} className="flex gap-2">
                <FileUploadButton
                    ticketId={ticketId}
                    onUploadComplete={handleUploadComplete}
                />
                <Input
                    placeholder="Type your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                />
                <Button
                    type="submit"
                    disabled={(!newComment.trim() && draftAttachments.length === 0) || isAddingComment}
                >
                    {isAddingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </form>
        </div>
    )
}
