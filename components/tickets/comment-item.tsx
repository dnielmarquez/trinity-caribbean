import type { Database } from '@/types/database'
import { formatDate } from '@/lib/date-utils'

type Comment = Database['public']['Tables']['ticket_comments']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface CommentWithAuthor extends Comment {
    author: Pick<Profile, 'full_name' | 'role'>
}

interface CommentItemProps {
    comment: CommentWithAuthor
}

export function CommentItem({ comment }: CommentItemProps) {
    return (
        <div className="border-l-2 border-blue-500 pl-4 py-2">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {comment.author?.full_name}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.created_at)}
                </span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                {comment.body.split('\n').map((line, i) => {
                    // Simple markdown image/video rendering
                    // Match ![Alt](Url) for images
                    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/)
                    // Match [Video](Url) for videos
                    const vidMatch = line.match(/^\[Video\]\((.*?)\)$/)

                    if (imgMatch) {
                        return (
                            <a
                                key={i}
                                href={imgMatch[2]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block my-2"
                            >
                                <img
                                    src={imgMatch[2]}
                                    alt={imgMatch[1]}
                                    className="max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-95 transition-opacity"
                                />
                            </a>
                        )
                    }
                    if (vidMatch) {
                        return (
                            <div key={i} className="my-2">
                                <video
                                    src={vidMatch[1]}
                                    controls
                                    className="max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-md"
                                />
                            </div>
                        )
                    }

                    // Don't render empty lines unless they might be spacers
                    if (line.trim() === '') return null

                    return <p key={i}>{line}</p>
                })}
            </div>
        </div>
    )
}
