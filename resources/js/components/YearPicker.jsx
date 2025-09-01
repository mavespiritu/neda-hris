"use client"

import React from "react"
import { CalendarIcon, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export function YearPicker({
  value,
  onChange,
  startYear = 1900,
  endYear = new Date().getFullYear(),
  placeholder = "Select year",
  className,
  isInvalid = false,
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false)
  const [selectedYear, setSelectedYear] = React.useState(value?.toString() || "")

  React.useEffect(() => {
    setSelectedYear(value?.toString() || "")
  }, [value])

  const years = React.useMemo(() => {
    const yearsArray = []
    for (let year = endYear; year >= startYear; year--) {
      yearsArray.push(year)
    }
    return yearsArray
  }, [startYear, endYear])

  const handleSelect = (year) => {
    setOpen(false)
    setSelectedYear(year.toString())
    onChange?.(year)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            readOnly
            disabled={disabled}
            placeholder={placeholder}
            value={selectedYear}
            className={cn(
              "pr-10 cursor-pointer",
              isInvalid && "border-red-500 focus:ring-red-500 focus:border-red-500",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            onClick={() => {
              if (!disabled) setOpen(true)
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
            onClick={() => {
              if (!disabled) setOpen(!open)
            }}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" sideOffset={5}>
        <Command>
          <CommandInput placeholder="Search year..." className="ring-0 border-0 outline-none focus:ring-0 focus:border-0 focus:outline-none" />
          <CommandList>
            <CommandEmpty>No year found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {years.map((year) => (
                <CommandItem key={year} value={year.toString()} onSelect={() => handleSelect(year)}>
                  {year}
                  {selectedYear === year.toString() && (
                    <Check className="ml-auto h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
