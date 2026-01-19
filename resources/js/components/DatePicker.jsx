import React, { useState, useEffect, useMemo } from "react"
import { format, parse, getYear, getMonth, isValid, startOfDay } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DatePicker = ({
  label = "Select Date",
  placeholder = "Pick a date",
  value,
  onDateChange,
  className,
  invalidMessage,
  disabled = false,
  minDate, // ✅ NEW: Date or "yyyy-MM-dd"
}) => {
  const parseYMD = (v) => {
    if (!v) return null
    if (v instanceof Date) return isValid(v) ? v : null
    if (typeof v === "string") {
      const d = parse(v, "yyyy-MM-dd", new Date())
      return isValid(d) ? d : null
    }
    return null
  }

  const minDateObj = useMemo(() => {
    const d = parseYMD(minDate)
    return d ? startOfDay(d) : null
  }, [minDate])

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = parseYMD(value)
    return d ? startOfDay(d) : null
  })
  const [isOpen, setIsOpen] = useState(false)

  const calendarKey = selectedDate ? `${getYear(selectedDate)}-${getMonth(selectedDate)}` : "default"

  useEffect(() => {
    const d = parseYMD(value)
    setSelectedDate(d ? startOfDay(d) : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleDateChange = (date) => {
    if (!date) return

    const picked = startOfDay(date)

    // ✅ enforce min date in case user clicks a disabled day somehow
    if (minDateObj && picked < minDateObj) return

    setSelectedDate(picked)
    onDateChange?.(format(picked, "yyyy-MM-dd"))
    setIsOpen(false)
  }

  const handleYearChange = (year) => {
    const newDate = new Date(selectedDate || new Date())
    newDate.setFullYear(year)

    const d = startOfDay(newDate)
    if (minDateObj && d < minDateObj) return

    setSelectedDate(d)
    onDateChange?.(format(d, "yyyy-MM-dd"))
  }

  const handleMonthChange = (month) => {
    const newDate = new Date(selectedDate || new Date())
    newDate.setMonth(month)

    const d = startOfDay(newDate)
    if (minDateObj && d < minDateObj) return

    setSelectedDate(d)
    onDateChange?.(format(d, "yyyy-MM-dd"))
  }

  const handleClear = () => {
    setSelectedDate(null)
    onDateChange?.(undefined)
    setIsOpen(false)
  }

  const years = Array.from({ length: 150 }, (_, i) => new Date().getFullYear() - 100 + i)
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  return (
    <div className={`flex flex-col space-y-2 ${className ?? ""}`}>
      <Popover open={isOpen} onOpenChange={(open) => !disabled && setIsOpen(open)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={`flex items-center justify-between w-full text-left ${
              invalidMessage ? "border-red-500 focus:ring-red-500" : ""
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
              {selectedDate ? (
                format(selectedDate, "MMMM dd, yyyy")
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </span>
            <CalendarIcon className="w-4 h-4 ml-2 flex-shrink-0 text-gray-500 hidden sm:block" />
          </Button>
        </PopoverTrigger>

        {!disabled && (
          <PopoverContent className="p-0 w-auto">
            <div className="flex justify-between items-center p-2">
              <Select
                value={
                  selectedDate
                    ? getMonth(selectedDate).toString()
                    : getMonth(new Date()).toString()
                }
                onValueChange={(v) => handleMonthChange(parseInt(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={
                  selectedDate
                    ? getYear(selectedDate).toString()
                    : getYear(new Date()).toString()
                }
                onValueChange={(v) => handleYearChange(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Calendar
              key={calendarKey}
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && handleDateChange(date)}
              defaultMonth={selectedDate || (minDateObj || new Date())}
              initialFocus
              // ✅ disables days earlier than minDate
              disabled={minDateObj ? { before: minDateObj } : undefined}
            />

            <div className="flex justify-end p-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          </PopoverContent>
        )}
      </Popover>

      {invalidMessage && <p className="text-xs text-red-500 mt-1">{invalidMessage}</p>}
    </div>
  )
}

export default DatePicker
