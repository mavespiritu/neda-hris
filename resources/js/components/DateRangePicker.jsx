import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
  className,
  startDate,
  endDate,
  onDateChange,
  invalidStartDateMessage,
  invalidEndDateMessage,
}) {
  const [date, setDate] = useState({
    from: startDate ?? null,
    to: endDate ?? null,
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setDate({
      from: startDate ?? null,
      to: endDate ?? null,
    })
  }, [startDate, endDate])

  const handleSelect = (range) => {
    const newRange =
      range?.from && range?.to
        ? { from: range.from, to: range.to }
        : range?.from
        ? { from: range.from, to: range.from }
        : { from: null, to: null }

    setDate(newRange)

    onDateChange?.(
      newRange.from ? format(newRange.from, "yyyy-MM-dd") : null,
      newRange.to ? format(newRange.to, "yyyy-MM-dd") : null
    )
  }

  const handleClear = () => {
    setDate({ from: null, to: null })
    onDateChange?.(null, null)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              (invalidStartDateMessage || invalidEndDateMessage) && "border-red-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "MMMM dd, yyyy")} –{" "}
                  {format(date.to, "MMMM dd, yyyy")}
                </>
              ) : (
                format(date.from, "MMMM dd, yyyy")
              )
            ) : (
              <span className="text-muted-foreground">Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              captionLayout="dropdown"
              fromYear={1990}
              toYear={new Date().getFullYear()}
              numberOfMonths={2}
              defaultMonth={date?.from ?? undefined}
              selected={date}
              onSelect={handleSelect}
              className="rounded-md border"
              classNames={{
                months: "flex flex-col sm:flex-row gap-4",
                month: "space-y-4 text-xs",
                caption: "w-full px-2 pt-1 relative",
                caption_label: "hidden",
                dropdowns: "grid grid-cols-2 gap-2 w-full",
                dropdown:
                  "w-full h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring",
                dropdown_month: "w-full mb-2",
                dropdown_year: "w-full",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1 top-1",
                nav_button_next: "absolute right-1 top-1",
              }}
            />

            {/* ACTION BUTTONS */}
            <div className="flex justify-end mt-3 gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClear}
              >
                Clear
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
