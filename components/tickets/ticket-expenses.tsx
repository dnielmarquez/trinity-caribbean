'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUploadButton } from '@/components/ui/file-upload-button'
import { addExpense, deleteExpense, getExpenses } from '@/actions/expenses'
import { toast } from 'sonner'
import { Trash2, Plus, Paperclip, ExternalLink, Image as ImageIcon } from 'lucide-react'
import type { Database } from '@/types/database'

type Expense = Database['public']['Tables']['ticket_expenses']['Row'] & {
    created_by_profile?: { full_name: string }
}

interface TicketExpensesProps {
    ticketId: string
    isEditable?: boolean
}

export function TicketExpenses({ ticketId, isEditable = false }: TicketExpensesProps) {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)

    // Form state
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [file, setFile] = useState<File | null>(null)

    useEffect(() => {
        loadExpenses()
    }, [ticketId])

    const loadExpenses = async () => {
        const result = await getExpenses(ticketId)
        if (result.data) {
            setExpenses(result.data)
        }
        setLoading(false)
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description || !amount) return

        setAdding(true)
        const formData = new FormData()
        formData.append('ticketId', ticketId)
        formData.append('description', description)
        formData.append('amount', amount)
        if (file) {
            formData.append('file', file)
        }

        const result = await addExpense(formData)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Expense added')
            setDescription('')
            setAmount('')
            setFile(null)
            loadExpenses()
        }
        setAdding(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        const result = await deleteExpense(id, ticketId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Expense removed')
            loadExpenses()
        }
    }

    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

    if (loading) return <div>Loading expenses...</div>

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Expenses & Costs</span>
                <span className="text-xl font-bold text-green-600">${total.toFixed(2)}</span>
            </h2>

            <div className="space-y-4 mb-6">
                {expenses.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No expenses recorded yet.</p>
                ) : (
                    <div className="space-y-3">
                        {expenses.map((expense) => (
                            <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900 dark:text-white">{expense.description}</span>
                                        {expense.attachment_url && (
                                            <a
                                                href={expense.attachment_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-500 hover:text-blue-600"
                                                title="View Receipt/Image"
                                            >
                                                <ImageIcon className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Added by {expense.created_by_profile?.full_name || 'User'} • {new Date(expense.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-gray-900 dark:text-white">${expense.amount.toFixed(2)}</span>
                                    {isEditable && (
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            className="text-red-500 hover:text-red-600 transition-colors p-1"
                                            title="Remove expense"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isEditable && (
                <form onSubmit={handleAdd} className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add New Expense</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Description (e.g. Paint cans)"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="flex-1"
                                required
                            />
                            <div className="relative w-32">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="pl-7"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="expense-file"
                                />
                                <label
                                    htmlFor="expense-file"
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm border cursor-pointer transition-colors ${file
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800'
                                            : 'bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                                        }`}
                                >
                                    <Paperclip className="w-4 h-4" />
                                    {file ? 'Image selected' : 'Attach Receipt'}
                                </label>
                            </div>
                            {file && (
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="text-gray-500 hover:text-red-500 text-sm"
                                >
                                    Clear
                                </button>
                            )}
                            <div className="flex-1" />
                            <Button type="submit" disabled={adding || !description || !amount}>
                                {adding ? 'Adding...' : 'Add Expense'}
                            </Button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    )
}
