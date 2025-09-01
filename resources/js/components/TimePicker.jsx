"use client"

import React, { useState, useEffect } from "react"
import { format, parse, setHours, setMinutes, setSeconds } from "date-fns"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

export default function TimePicker({
  label,
  placeholder = "Select time",
  value,
  onTimeChange,
  className,
  invalidMessage,
  disabled = false,
  displayFormat = "h:mm a",
  returnFormat = "HH:mm",
  showSeconds = false
}) {
  const [selectedTime, setSelectedTime] = useState(
    value ? parse(value, returnFormat, new Date()) : null
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (value) {
      try {
        const baseDate = new Date()
        const parsedTime = parse(value, returnFormat, baseDate)
        setSelectedTime(parsedTime)
      } catch (error) {
        console.error("Invalid time format:", error)
      }
    }
  }, [value, returnFormat])

  const handleTimeChange = (type, val) => {
    const baseTime = selectedTime || new Date()
    let newTime = new Date(baseTime)

    if (type === "hour") {
      newTime = setHours(newTime, parseInt(val))
    } else if (type === "minute") {
      newTime = setMinutes(newTime, parseInt(val))
    } else if (type === "second") {
      newTime = setSeconds(newTime, parseInt(val))
    }

    setSelectedTime(newTime)

    if (onTimeChange) {
      onTimeChange(format(newTime, returnFormat))
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)
  const seconds = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "flex items-center justify-between w-full text-left font-normal",
              !selectedTime && "text-gray-400 font-medium",
              invalidMessage && "border-destructive focus-visible:ring-destructive"
            )}
          >
            {selectedTime ? format(selectedTime, displayFormat) : <span>{placeholder}</span>}
            <Clock className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-center space-x-2">
              {/* Hour */}
              <Select
                value={selectedTime ? selectedTime.getHours().toString() : "0"}
                onValueChange={(val) => handleTimeChange("hour", val)}
              >
                <SelectTrigger className="h-9 w-[70px]">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[200px]">
                  {hours.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()} className="text-sm">
                      {hour.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-center">:</span>

              {/* Minute */}
              <Select
                value={selectedTime ? selectedTime.getMinutes().toString() : "0"}
                onValueChange={(val) => handleTimeChange("minute", val)}
              >
                <SelectTrigger className="h-9 w-[70px]">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[200px]">
                  {minutes.map((minute) => (
                    <SelectItem key={minute} value={minute.toString()} className="text-sm">
                      {minute.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Second (optional) */}
              {showSeconds && (
                <>
                  <span className="text-center">:</span>
                  <Select
                    value={selectedTime ? selectedTime.getSeconds().toString() : "0"}
                    onValueChange={(val) => handleTimeChange("second", val)}
                  >
                    <SelectTrigger className="h-9 w-[70px]">
                      <SelectValue placeholder="Sec" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-[200px]">
                      {seconds.map((second) => (
                        <SelectItem key={second} value={second.toString()} className="text-sm">
                          {second.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => {
                  const now = new Date()
                  setSelectedTime(now)
                  if (onTimeChange) {
                    onTimeChange(format(now, returnFormat))
                  }
                }}
              >
                Now
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={() => {
                  if (selectedTime) {
                    setIsOpen(false)
                  }
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {invalidMessage && <p className="text-sm text-destructive mt-1">{invalidMessage}</p>}
    </div>
  )
}