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
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

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
  showSeconds = false,
}) {
  const [selectedTime, setSelectedTime] = useState(
    value ? parse(value, returnFormat, new Date()) : null
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (value) {
      try {
        const baseDate = new Date()
        let parsedTime

        if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
          parsedTime = parse(value, "HH:mm:ss", baseDate)
        } else if (/^\d{2}:\d{2}$/.test(value)) {
          parsedTime = parse(value, "HH:mm", baseDate)
        } else {
          parsedTime = parse(value, returnFormat, baseDate)
        }

        setSelectedTime(parsedTime)
      } catch (error) {
        console.error("Invalid time format:", value, error)
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

  // helper to render a combo input+dropdown
  const renderTimeField = (type, max, values) => {
    const current =
      selectedTime &&
      (type === "hour"
        ? selectedTime.getHours()
        : type === "minute"
        ? selectedTime.getMinutes()
        : selectedTime.getSeconds())

    return (
      <div className="flex items-center border rounded-md w-[90px]">
        <Input
          type="text"
          value={current?.toString().padStart(2, "0") ?? ""}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "")
            if (val !== "" && val >= 0 && val < max) {
              handleTimeChange(type, val)
            }
          }}
          className="flex-1 px-2 h-9 text-sm border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder={type === "hour" ? "HH" : type === "minute" ? "MM" : "SS"}
        />
        <Select
          onValueChange={(val) => handleTimeChange(type, val)}
          value={current?.toString() ?? ""}
        >
          <SelectTrigger className="h-9 w-8 justify-center p-0 border-0 shadow-none" />
          <SelectContent side="bottom" align="start" className="max-h-[200px] overflow-y-auto">
            {values.map((num) => (
              <SelectItem key={num} value={num.toString()} className="text-sm">
                {num.toString().padStart(2, "0")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

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
              invalidMessage &&
                "border-destructive focus-visible:ring-destructive"
            )}
          >
            {selectedTime ? (
              format(selectedTime, displayFormat)
            ) : (
              <span>{placeholder}</span>
            )}
            <Clock className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-4 max-w-[95vw] overflow-hidden"
          align="start"
          sideOffset={4}
        >
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-center space-x-2">
              {renderTimeField("hour", 24, hours)}
              <span>:</span>
              {renderTimeField("minute", 60, minutes)}
              {showSeconds && (
                <>
                  <span>:</span>
                  {renderTimeField("second", 60, seconds)}
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
      {invalidMessage && (
        <p className="text-xs text-destructive mt-1">{invalidMessage}</p>
      )}
    </div>
  )
}
