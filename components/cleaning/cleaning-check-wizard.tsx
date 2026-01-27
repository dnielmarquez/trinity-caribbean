'use client'

import { useState } from 'react'
import { Check, X, ChevronRight, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createTicket } from '@/actions/create-ticket'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/lib/categories'
import { FileUploadButton } from '@/components/ui/file-upload-button'

type Unit = { id: string; name: string }
type Property = { id: string; name: string; units: Unit[] }

interface CleaningCheckWizardProps {
    properties: Property[]
}

// Updated checks with explicit categories
const CHECKS = [
    { id: 'ac', label: 'Air Conditioner', category: 'ac' },
    { id: 'internet', label: 'Internet', category: 'wifi' },
    { id: 'hot_water', label: 'Hot Water', category: 'plumbing' },
]

export function CleaningCheckWizard({ properties }: CleaningCheckWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
    const [isLoading, setIsLoading] = useState(false)

    // Step 1 Data
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
    const [selectedUnitId, setSelectedUnitId] = useState<string>('')

    // Step 2 Data
    // Map of checkId -> 'good' | 'wrong'
    const [checkResults, setCheckResults] = useState<Record<string, 'good' | 'wrong'>>({})

    // Step 3 Data (Report Other)
    const [otherDescription, setOtherDescription] = useState('')
    const [otherCategory, setOtherCategory] = useState<string>('other')
    const [attachments, setAttachments] = useState<{ url: string; kind: 'image' | 'video' }[]>([])

    const handleStartCheck = () => {
        if (selectedPropertyId && selectedUnitId) {
            setStep(2)
        } else {
            toast.error('Please select both Property and Unit')
        }
    }

    const handleCheckSelection = (checkId: string, status: 'good' | 'wrong') => {
        setCheckResults(prev => ({ ...prev, [checkId]: status }))
    }

    const allChecksAnswered = CHECKS.every(c => checkResults[c.id])

    const handleSubmitChecklist = async () => {
        if (!allChecksAnswered) return

        setIsLoading(true)
        let failureCount = 0

        // Filter for wrong items
        const wrongItems = CHECKS.filter(c => checkResults[c.id] === 'wrong')

        // If nothing is wrong, just success state
        if (wrongItems.length === 0) {
            toast.success('Inspection passed! No issues found.')
            setIsLoading(false)
            setStep(4)
            return
        }

        const promises = wrongItems.map(item => {
            return createTicket({
                property_id: selectedPropertyId,
                unit_id: selectedUnitId,
                type: 'corrective',
                category: (item as any).category,
                priority: 'urgent',
                description: `Cleaning Check Failed: ${item.label}`,
                requires_spend: false,
            })
        })

        const results = await Promise.all(promises)

        results.forEach(res => {
            if (res.error) failureCount++
        })

        setIsLoading(false)

        if (failureCount > 0) {
            toast.error(`Failed to create ${failureCount} tickets. Please try again.`)
        } else {
            toast.success(`Report submitted. ${wrongItems.length} issue(s) reported.`)
            setStep(4)
        }
    }

    const handleSubmitOther = async () => {
        if (!otherDescription || otherDescription.length < 5) {
            toast.error('Please provide a description')
            return
        }

        if (attachments.length === 0) {
            toast.error('Please upload at least one photo or video')
            return
        }

        setIsLoading(true)

        const result = await createTicket({
            property_id: selectedPropertyId,
            unit_id: selectedUnitId,
            type: 'corrective',
            category: otherCategory as any,
            priority: 'high',
            description: otherDescription,
            requires_spend: false,
            attachments: attachments.length > 0 ? attachments : undefined
        })

        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Issue reported successfully')
            setStep(4)
        }
    }

    const handleReset = () => {
        setStep(1)
        setSelectedPropertyId('')
        setSelectedUnitId('')
        setCheckResults({})
        setOtherDescription('')
        setOtherCategory('other')
        setAttachments([])
    }

    // Derived state
    const selectedProperty = properties.find(p => p.id === selectedPropertyId)
    const availableUnits = selectedProperty?.units || []
    const categoryOptions = Object.entries(CATEGORIES).map(([key, config]) => ({
        id: key,
        label: config.label,
        icon: config.icon
    }))

    return (
        <div className="space-y-6">
            {/* Context Header */}
            {step > 1 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Inspecting</p>
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">
                            {selectedProperty?.name} <span className="text-gray-400 mx-1">•</span> {availableUnits.find(u => u.id === selectedUnitId)?.name}
                        </p>
                    </div>
                    {step === 2 && (
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs h-8">
                            Change
                        </Button>
                    )}
                </div>
            )}

            {step === 1 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Property
                            </label>
                            <select
                                className="w-full p-4 text-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={selectedPropertyId}
                                onChange={(e) => {
                                    setSelectedPropertyId(e.target.value)
                                    setSelectedUnitId('')
                                }}
                            >
                                <option value="">Select Property...</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Unit
                            </label>
                            <select
                                className="w-full p-4 text-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                                value={selectedUnitId}
                                onChange={(e) => setSelectedUnitId(e.target.value)}
                                disabled={!selectedPropertyId}
                            >
                                <option value="">Select Unit...</option>
                                {availableUnits.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 text-lg font-semibold rounded-xl shadow-blue-200 dark:shadow-none"
                        size="lg"
                        onClick={handleStartCheck}
                        disabled={!selectedPropertyId || !selectedUnitId}
                    >
                        Start Inspection <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-4">
                        {CHECKS.map((check) => {
                            const status = checkResults[check.id]
                            return (
                                <div
                                    key={check.id}
                                    className={cn(
                                        "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-2 transition-all duration-200",
                                        status === 'good' ? "border-green-500 dark:border-green-500" :
                                            status === 'wrong' ? "border-red-500 dark:border-red-500" :
                                                "border-transparent"
                                    )}
                                >
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                                        {check.label}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleCheckSelection(check.id, 'good')}
                                            className={cn(
                                                "flex items-center justify-center gap-2 py-4 rounded-lg font-medium transition-all",
                                                status === 'good'
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            <Check className="w-5 h-5" /> Good
                                        </button>
                                        <button
                                            onClick={() => handleCheckSelection(check.id, 'wrong')}
                                            className={cn(
                                                "flex items-center justify-center gap-2 py-4 rounded-lg font-medium transition-all",
                                                status === 'wrong'
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            <X className="w-5 h-5" /> Wrong
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="pt-4 space-y-3">
                        <Button
                            className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg"
                            size="lg"
                            onClick={handleSubmitChecklist}
                            disabled={!allChecksAnswered || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Save Report'
                            )}
                        </Button>

                        <Button
                            variant="secondary"
                            className="w-full h-12 text-base rounded-xl border border-gray-200 dark:border-gray-700"
                            onClick={() => setStep(3)}
                            disabled={isLoading || !allChecksAnswered}
                        >
                            Report other issue
                        </Button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report Other Issue</h2>
                        <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Back</Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {categoryOptions.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setOtherCategory(cat.id)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-lg border transition-all",
                                            otherCategory === cat.id
                                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        )}
                                    >
                                        <cat.icon className="w-6 h-6 mb-1" />
                                        <span className="text-xs font-medium">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                className="w-full p-4 min-h-[120px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                placeholder="Describe the issue..."
                                value={otherDescription}
                                onChange={(e) => setOtherDescription(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Photos / Videos
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map((att, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                        <img src={att.url} alt="Attachment" className="w-full h-full object-cover" />
                                        {att.kind === 'video' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                                                    <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-black ml-1"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <FileUploadButton
                                    onUploadComplete={(url, type) => setAttachments([...attachments, { url, kind: type }])}
                                    variant="outline"
                                    className="h-20 w-20"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg"
                        size="lg"
                        onClick={handleSubmitOther}
                        disabled={isLoading || !otherDescription || attachments.length === 0}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            'Submit Report'
                        )}
                    </Button>
                </div>
            )}

            {step === 4 && (
                <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                        <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                        Report Submitted
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-8 max-w-xs mx-auto">
                        Thank you. Your report has been sent successfully.
                    </p>

                    <Button
                        className="w-full h-12 text-base rounded-xl"
                        onClick={handleReset}
                    >
                        <RotateCcw className="w-4 h-4 mr-2" /> Start New Inspection
                    </Button>
                </div>
            )}
        </div>
    )
}
