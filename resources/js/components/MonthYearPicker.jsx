"use client"

import React from "react"
import { CalendarIcon, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add fullLabel for display
const months = [
  { value: 1, label: "Jan", fullLabel: "January" },
  { value: 2, label: "Feb", fullLabel: "February" },
  { value: 3, label: "Mar", fullLabel: "March" },
  { value: 4, label: "Apr", fullLabel: "April" },
  { value: 5, label: "May", fullLabel: "May" },
  { value: 6, label: "Jun", fullLabel: "June" },
  { value: 7, label: "Jul", fullLabel: "July" },
  { value: 8, label: "Aug", fullLabel: "August" },
  { value: 9, label: "Sep", fullLabel: "September" },
  { value: 10, label: "Oct", fullLabel: "October" },
  { value: 11, label: "Nov", fullLabel: "November" },
  { value: 12, label: "Dec", fullLabel: "December" },
]

export function MonthYearPicker({
  value,
  onChange,
  startYear = 1900,
  endYear = new Date().getFullYear(),
  placeholder = "Select month & year",
  className,
  isInvalid = false,
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false)
  const [selectedMonth, setSelectedMonth] = React.useState(value?.month || null)
  const [selectedYear, setSelectedYear] = React.useState(value?.year || "")

  React.useEffect(() => {
    setSelectedMonth(value?.month || null)
    setSelectedYear(value?.year || "")
  }, [value])

  const years = React.useMemo(() => {
    const arr = []
    for (let y = endYear; y >= startYear; y--) arr.push(y)
    return arr
  }, [startYear, endYear])

  const handleMonthSelect = (month) => {
    setSelectedMonth(month)
    onChange?.({ month, year: selectedYear })
    setOpen(false)
  }

  // Use fullLabel for selected input
  const displayValue = selectedMonth && selectedYear
    ? `${months.find(m => m.value === selectedMonth)?.fullLabel} ${selectedYear}`
    : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            readOnly
            disabled={disabled}
            placeholder={placeholder}
            value={displayValue}
            className={cn(
              "pr-10 cursor-pointer",
              isInvalid && "border-red-500 focus:ring-red-500 focus:border-red-500",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            onClick={() => !disabled && setOpen(true)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
            onClick={() => !disabled && setOpen(!open)}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>

      <PopoverContent className="p-4 w-[220px]" align="start" sideOffset={5}>
        {/* Year dropdown */}
        <Select
          value={selectedYear.toString()}
          onValueChange={(val) => setSelectedYear(Number(val))}
        >
          <SelectTrigger className="mb-4">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Month tiles (use short label) */}
        <div className="grid grid-cols-3 gap-2">
          {months.map((month) => {
            const isSelected = selectedMonth === month.value
            return (
              <Button
                key={month.value}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={cn(
                  "flex items-center justify-center",
                  isSelected && "gap-1 text-xs"
                )}
                onClick={() => handleMonthSelect(month.value)}
              >
                {month.label}
                {isSelected && <Check className="ml-1 h-4 w-4" />}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
