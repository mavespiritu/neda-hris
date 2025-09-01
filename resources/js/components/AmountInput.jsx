"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"

export default function AmountInput({ 
  value, 
  onChange,
  placeholder = "Enter amount", 
  className,
  isInvalid, 
  ...props 
}) {
  const [displayValue, setDisplayValue] = useState("")
  const inputRef = useRef(null)

  // Format the value by adding commas
  const formatValue = useCallback((val) => {
    if (!val) return ""

    // Ensure that the value is always a string for splitting
    const stringVal = val.toString()
    const parts = stringVal.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return parts.join(".")
  }, [])

  // Parse the value by removing commas
  const parseValue = (val) => {
    return val.replace(/,/g, "")
  }

  // Update the displayed value whenever the input value changes
  useEffect(() => {
    setDisplayValue(formatValue(value))
  }, [value, formatValue])

  const handleChange = (e) => {
    let inputValue = e.target.value

    // Remove any non-digit characters except commas and one period
    inputValue = inputValue.replace(/[^\d,.]/g, "")

    // Ensure only one period
    const periodIndex = inputValue.indexOf(".")
    if (periodIndex !== -1) {
      inputValue = inputValue.slice(0, periodIndex + 1) + inputValue.slice(periodIndex + 1).replace(/\./g, "")
    }

    // Format the value with commas and set the display value
    const formattedValue = formatValue(parseValue(inputValue))
    setDisplayValue(formattedValue)

    // Pass the parsed value to onChange (removing commas)
    const parsedValue = parseValue(inputValue)
    onChange(parsedValue === "" ? undefined : parsedValue)
  }

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length)
    }
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={`text-right ${isInvalid ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
      {...props}
    />
  )
}
