"use client"

import * as React from "react"
import { Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface MultiSelectDropdownProps {
    title: string
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
    selectedValues: string[]
    onChange: (values: string[]) => void
    align?: "start" | "end" | "center"
}

export function MultiSelectDropdown({
    title,
    options,
    selectedValues,
    onChange,
    align = "start",
}: MultiSelectDropdownProps) {
    const handleSelect = (value: string) => {
        const newSelectedValues = selectedValues.includes(value)
            ? selectedValues.filter((item) => item !== value)
            : [...selectedValues, value]
        onChange(newSelectedValues)
    }

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange([])
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-dashed">
                    <Filter className="mr-2 h-4 w-4" />
                    {title}
                    {selectedValues.length > 0 && (
                        <Badge
                            variant="secondary"
                            className="ml-2 rounded-sm px-1 font-normal"
                        >
                            {selectedValues.length}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-[200px]">
                <DropdownMenuLabel>{title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {options.map((option) => {
                    const isSelected = selectedValues.includes(option.value)
                    return (
                        <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={isSelected}
                            onCheckedChange={() => handleSelect(option.value)}
                            onSelect={(e) => e.preventDefault()}
                        >
                            {option.icon && (
                                <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                            )}
                            <span>{option.label}</span>
                        </DropdownMenuCheckboxItem>
                    )
                })}
                {selectedValues.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="p-1">
                            <Button
                                variant="ghost"
                                className="w-full justify-center text-xs h-8"
                                onClick={() => onChange([])}
                            >
                                Clear filters
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
