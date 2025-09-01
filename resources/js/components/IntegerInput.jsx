"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown } from "lucide-react"

export default function IntegerInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder = "Enter number",
  className,
  isInvalid = false,
  disabled = false,
  ...props
}) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    setInputValue(value != null ? value.toString() : "")
  }, [value])

  const handleChange = (e) => {
    if (disabled) return
    const newValue = e.target.value.replace(/[^0-9-]/g, "")
    setInputValue(newValue)
    updateValue(newValue)
  }

  const updateValue = (newValue) => {
    const parsedValue = Number.parseInt(newValue, 10)
    if (!isNaN(parsedValue)) {
      let clampedValue = parsedValue
      if (min !== undefined) clampedValue = Math.max(min, clampedValue)
      if (max !== undefined) clampedValue = Math.min(max, clampedValue)
      onChange(clampedValue)
    } else {
      onChange(undefined)
    }
  }

  const increment = () => {
    if (!disabled) {
      updateValue((Number.parseInt(inputValue, 10) || 0) + step)
    }
  }

  const decrement = () => {
    if (!disabled) {
      updateValue((Number.parseInt(inputValue, 10) || 0) - step)
    }
  }

  const handleKeyDown = (e) => {
    if (disabled) return
    if (e.key === "ArrowUp") {
      e.preventDefault()
      increment()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      decrement()
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`pr-16 ${isInvalid ? "border-red-500 focus:ring-red-500" : ""} ${className}`}
        disabled={disabled}
        {...props}
      />
      <div className="absolute right-0 top-0 h-full flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-1/2 px-2 rounded-none rounded-tr-md"
          onClick={increment}
          disabled={disabled}
          tabIndex={-1}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-1/2 px-2 rounded-none rounded-br-md"
          onClick={decrement}
          disabled={disabled}
          tabIndex={-1}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
