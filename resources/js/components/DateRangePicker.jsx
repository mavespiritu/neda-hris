import { useState, useEffect } from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({ className, startDate, endDate, onDateChange, invalidStartDateMessage, invalidEndDateMessage }) {
  const [date, setDate] = useState({
    from: startDate,
    to: endDate,
  })

  useEffect(() => {
    if (startDate && endDate) {
      setDate({ from: startDate, to: endDate })
    }
  }, [startDate, endDate])

  const handleSelect = (range) => {
    // Ensure that `range` is valid and has both `from` and `to` dates
    const newRange = range?.from && range?.to
      ? { from: range.from, to: range.to }
      : range?.from
      ? { from: range.from, to: range.from }
      : { from: null, to: null } // Handle deselecting
  
    setDate(newRange)
  
    // Check if the `onDateChange` callback exists and pass null for deselected cases
    if (onDateChange) {
      onDateChange(newRange?.from ?? null, newRange?.to ?? null)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              `w-full justify-start text-left font-normal ${invalidStartDateMessage && invalidEndDateMessage ? 'border-red-500' : ''}`,
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "MMMM dd, yyyy")} -{" "}
                  {format(date.to, "MMMM dd, yyyy")}
                </>
              ) : (
                format(date.from, "MMMM dd, yyyy")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
