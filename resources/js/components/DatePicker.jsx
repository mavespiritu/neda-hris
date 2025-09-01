import React, { useState, useEffect } from "react"
import { format, parse, getYear, getMonth } from "date-fns"
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
  disabled = false
}) => {

  const [selectedDate, setSelectedDate] = useState(value ? parse(value, 'yyyy-MM-dd', new Date()) : null)
  const [isOpen, setIsOpen] = useState(false)

  // Use a key to force the Calendar to re-render when the year or month changes
  const calendarKey = selectedDate ? `${getYear(selectedDate)}-${getMonth(selectedDate)}` : "default"

  useEffect(() => {
    if (value) {
      setSelectedDate(parse(value, 'yyyy-MM-dd', new Date()))
    } else {
      setSelectedDate(null)
    }
  }, [value])

  const handleDateChange = (date) => {
    setSelectedDate(date)
    if (onDateChange) {
      onDateChange(format(date, 'yyyy-MM-dd'))
    }
    setIsOpen(false)
  }

  const handleYearChange = (year) => {
    const newDate = new Date(selectedDate || new Date())
    newDate.setFullYear(year)
    setSelectedDate(newDate)
  }

  const handleMonthChange = (month) => {
    const newDate = new Date(selectedDate || new Date())
    newDate.setMonth(month)
    setSelectedDate(newDate)
  }

  const handleClear = () => {
    setSelectedDate(null)
    if (onDateChange) {
      onDateChange(undefined)
    }
    setIsOpen(false)
  }

  const years = Array.from({ length: 150 }, (_, i) => new Date().getFullYear() - 100 + i)
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]

  return (
    <div className="flex flex-col space-y-2">
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
                value={selectedDate ? getMonth(selectedDate).toString() : getMonth(new Date()).toString()}
                onValueChange={(value) => handleMonthChange(parseInt(value))}
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
                value={selectedDate ? getYear(selectedDate).toString() : getYear(new Date()).toString()}
                onValueChange={(value) => handleYearChange(parseInt(value))}
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
              defaultMonth={selectedDate || new Date()}
              initialFocus
            />
            <div className="flex justify-end p-2 border-t">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          </PopoverContent>
        )}
      </Popover>
      {invalidMessage && (
        <p className="text-xs text-red-500 mt-1">{invalidMessage}</p>
      )}
    </div>
  )
}

export default DatePicker
