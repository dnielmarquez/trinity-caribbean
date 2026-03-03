'use client'

import * as React from 'react'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CheckCircle2, DollarSign, Clock, AlertTriangle, CalendarIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format, subDays } from 'date-fns'

interface Ticket {
    id: string
    status: string
    priority: string
    created_at: string
    resolved_at: string | null
    closed_at: string | null
    created_by: string
    assigned_to_user_id: string | null
    ticket_expenses?: { amount: number }[] | null
}

interface AnalyticsClientProps {
    tickets: Ticket[]
    activeBlocks: any[]
    profiles: any[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
const PRIORITY_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', urgent: '#7f1d1d' }

export default function AnalyticsClient({ tickets, activeBlocks, profiles }: AnalyticsClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Parse existing dates from URL
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // Custom date range state
    const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
        from: fromParam ? new Date(fromParam) : undefined,
        to: toParam ? new Date(toParam) : undefined,
    })

    // Employee role filter state
    const [roleFilter, setRoleFilter] = React.useState<string>('all')

    // Handler for preset buttons
    const handlePreset = (days: number | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (days === null) {
            params.delete('from')
            params.delete('to')
            setDateRange({ from: undefined, to: undefined })
        } else {
            const end = new Date()
            const start = subDays(end, days)
            params.set('from', start.toISOString())
            params.set('to', end.toISOString())
            setDateRange({ from: start, to: end })
        }
        router.push(`?${params.toString()}`)
    }

    // Handler for custom date picker
    const handleCustomDateSelect = (range: any) => {
        setDateRange(range)
        const params = new URLSearchParams(searchParams.toString())
        if (range?.from) {
            params.set('from', range.from.toISOString())
        } else {
            params.delete('from')
        }
        if (range?.to) {
            params.set('to', range.to.toISOString())
        } else {
            params.delete('to')
        }
        router.push(`?${params.toString()}`)
    }

    const {
        totalSpending,
        avgResolutionTimeDays,
        complianceRate,
        statusData,
        priorityData,
        bottleneckData,
        employeePerformance,
        availableRoles
    } = useMemo(() => {
        let spending = 0
        let resolvedCount = 0
        let totalResolutionTime = 0
        const statusMap: Record<string, number> = {}
        const priorityMap: Record<string, number> = {}

        const bottleneckMap: Record<string, { totalDays: number; count: number }> = {}
        const employeeMap: Record<string, { created: number; resolved: number }> = {}

        // Initialize Employee Map
        profiles.forEach(p => {
            employeeMap[p.id] = { created: 0, resolved: 0 }
        })

        tickets.forEach(ticket => {
            // Spending
            if (ticket.ticket_expenses && Array.isArray(ticket.ticket_expenses)) {
                ticket.ticket_expenses.forEach((expense) => {
                    spending += Number(expense.amount) || 0
                })
            }

            // Status and Priority distributions
            statusMap[ticket.status] = (statusMap[ticket.status] || 0) + 1
            priorityMap[ticket.priority] = (priorityMap[ticket.priority] || 0) + 1

            // Resolution Time & Compliance
            if (ticket.status === 'resolved' || ticket.status === 'closed') {
                resolvedCount++
                const endDate = ticket.closed_at ? new Date(ticket.closed_at) : (ticket.resolved_at ? new Date(ticket.resolved_at) : new Date())
                const startDate = new Date(ticket.created_at)
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                totalResolutionTime += diffDays
            }

            // Bottleneck (Days open per status)
            // Simplified: we only know current status and created_at. A true bottleneck tracks transition times.
            // As an approximation, let's look at how old tickets currently in each status are.
            if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
                const ageDays = Math.ceil(Math.abs(new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60 * 24))
                if (!bottleneckMap[ticket.status]) {
                    bottleneckMap[ticket.status] = { totalDays: 0, count: 0 }
                }
                bottleneckMap[ticket.status].totalDays += ageDays
                bottleneckMap[ticket.status].count += 1
            }

            // Employee Stats
            if (ticket.created_by && employeeMap[ticket.created_by]) {
                employeeMap[ticket.created_by].created += 1
            }
            if (ticket.assigned_to_user_id && employeeMap[ticket.assigned_to_user_id] && (ticket.status === 'resolved' || ticket.status === 'closed')) {
                employeeMap[ticket.assigned_to_user_id].resolved += 1
            }
        })

        const avgResolutionTime = resolvedCount > 0 ? (totalResolutionTime / resolvedCount).toFixed(1) : '0'
        const compRate = tickets.length > 0 ? ((resolvedCount / tickets.length) * 100).toFixed(1) : '0'

        // Formatting for charts
        const sData = Object.entries(statusMap).map(([name, value]) => ({ name, value }))
        const pData = Object.entries(priorityMap).map(([name, value]) => ({ name, value }))
        const bData = Object.entries(bottleneckMap).map(([name, data]) => ({
            name,
            avgDays: Number((data.totalDays / data.count).toFixed(1))
        }))

        // Employee array - removed the filter so everyone shows up, and applying roleFilter if available
        let eData = profiles.map(p => ({
            name: p.full_name,
            role: p.role,
            ...employeeMap[p.id]
        }))

        if (roleFilter !== 'all') {
            eData = eData.filter(e => e.role === roleFilter)
        }

        eData = eData.sort((a, b) => b.resolved - a.resolved)

        return {
            totalSpending: spending,
            avgResolutionTimeDays: avgResolutionTime,
            complianceRate: compRate,
            statusData: sData,
            priorityData: pData,
            bottleneckData: bData,
            employeePerformance: eData,
            availableRoles: Array.from(new Set(profiles.map(p => p.role))) // Distinct roles for the select
        }
    }, [tickets, profiles, roleFilter])

    return (
        <div className="space-y-6">
            {/* Time Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                    <Button variant={!fromParam && !toParam ? "default" : "outline"} onClick={() => handlePreset(null)} size="sm">
                        All Time
                    </Button>
                    <Button variant={fromParam && !toParam && new Date().getTime() - new Date(fromParam).getTime() < 8 * 24 * 60 * 60 * 1000 ? "default" : "outline"} onClick={() => handlePreset(7)} size="sm">
                        7 Days
                    </Button>
                    <Button variant={fromParam && !toParam && new Date().getTime() - new Date(fromParam).getTime() < 16 * 24 * 60 * 60 * 1000 && new Date().getTime() - new Date(fromParam).getTime() > 8 * 24 * 60 * 60 * 1000 ? "default" : "outline"} onClick={() => handlePreset(15)} size="sm">
                        15 Days
                    </Button>
                    <Button variant={fromParam && !toParam && new Date().getTime() - new Date(fromParam).getTime() > 16 * 24 * 60 * 60 * 1000 ? "default" : "outline"} onClick={() => handlePreset(30)} size="sm">
                        30 Days
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={
                                    `w-[260px] justify-start text-left font-normal ${!dateRange?.from && "text-muted-foreground"}`
                                }
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a custom range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={handleCustomDateSelect}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                        <DollarSign className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalSpending.toFixed(2)}</div>
                        <p className="text-xs text-gray-500 mt-1">Based on closed/costed tickets</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                        <Clock className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgResolutionTimeDays} days</div>
                        <p className="text-xs text-gray-500 mt-1">From creation to resolution</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{complianceRate}%</div>
                        <p className="text-xs text-gray-500 mt-1">Tickets resolved this period</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1 border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Tickets by Priority</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={priorityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={(PRIORITY_COLORS as any)[entry.name] || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1 lg:col-span-2 border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Bottlenecks (Avg Days Open by Status)</CardTitle>
                        <CardDescription>How long active tickets have been sitting in current statuses.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bottleneckData}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="avgDays" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Blockage Monitor */}
            <Card className="border-red-200 dark:border-red-900 border-2">
                <CardHeader className="bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Blockage Monitor</CardTitle>
                    </div>
                    <CardDescription className="text-red-800/70 dark:text-red-200/70">
                        Properties/Units currently blocked from sale due to maintenance.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    {activeBlocks.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No units are currently blocked. Good job!</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Property/Unit</th>
                                        <th className="px-4 py-3">Reason</th>
                                        <th className="px-4 py-3">Blocked By</th>
                                        <th className="px-4 py-3 rounded-tr-lg">Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeBlocks.map((block) => (
                                        <tr key={block.id} className="border-b dark:border-gray-700">
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                                {block.property_name} {block.unit_name ? `- ${block.unit_name}` : ''}
                                            </td>
                                            <td className="px-4 py-3">{block.reason}</td>
                                            <td className="px-4 py-3">{block.blocked_by_name}</td>
                                            <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400">
                                                {Math.round(block.blocked_duration_hours)} hrs
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Employee Performance */}
            <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-sm font-medium">Employee Performance Summary</CardTitle>
                        <CardDescription>Tickets created and resolved per user spanning the selected period.</CardDescription>
                    </div>
                    <select
                        className="p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        {availableRoles.map(r => (
                            <option key={r} value={r}>{r.replace('_', ' ')}</option>
                        ))}
                    </select>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Employee</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3 text-center">Tickets Created</th>
                                    <th className="px-4 py-3 text-center rounded-tr-lg">Tickets Resolved</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employeePerformance.map((emp) => (
                                    <tr key={emp.name} className="border-b dark:border-gray-700">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            {emp.name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 capitalize">{emp.role.replace('_', ' ')}</td>
                                        <td className="px-4 py-3 text-center">{emp.created}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-green-600 dark:text-green-400">{emp.resolved}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
