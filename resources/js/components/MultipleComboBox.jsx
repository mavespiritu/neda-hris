import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const MultipleComboBox = ({
  items,
  name,
  onChange,
  value = [],
  invalidMessage,
  placeholder,
  ref,
  width,
  labelWidth,
  className,
  renderLabel,
}) => {
  const [open, setOpen] = useState(false)
  const [selectedValues, setSelectedValues] = useState(value)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    setSelectedValues(value)
  }, [value])

  useEffect(() => {
    if (!open) {
      setInputValue("")
    }
  }, [open])

  const toggleSelection = (currentValue) => {
    const updatedValues = selectedValues.includes(currentValue)
      ? selectedValues.filter((val) => val !== currentValue)
      : [...selectedValues, currentValue]

    setSelectedValues(updatedValues)
    onChange(updatedValues)
  }

  const toggleSelectAll = () => {
    const updatedValues =
      selectedValues.length === items.length
        ? []
        : items.map((item) => item.value)

    setSelectedValues(updatedValues)
    onChange(updatedValues)
  }

  const getToggleLabel = () =>
    selectedValues.length === items.length ? "Deselect All" : "Select All"

  const getButtonLabel = () => {
    if (selectedValues.length === 0) {
      return { text: placeholder || `Choose ${name}...`, isPlaceholder: true }
    }

    if (selectedValues.length === 1) {
      const selectedItem = items.find((item) => item.value === selectedValues[0])
      return {
        text: selectedItem ? (renderLabel ? renderLabel(selectedItem) : selectedItem.label) : (placeholder || `Choose ${name}...`),
        isPlaceholder: !selectedItem,
      }
    }

    return { text: `${selectedValues.length} selected`, isPlaceholder: false }
  }

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  const { text: buttonLabel, isPlaceholder } = getButtonLabel()

  return (
    <div ref={ref} className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "h-auto min-h-10 w-full items-start justify-between whitespace-normal break-words text-left",
              invalidMessage && "border-red-500",
              isPlaceholder && "text-gray-400"
            )}
          >
            <span className={cn("min-w-0 flex-1 pr-2", labelWidth || "w-full")}>{buttonLabel}</span>
            <ChevronsUpDown className="ml-2 mt-0.5 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-full p-0", width)}>
          <Command>
            <CommandInput
              placeholder="Type to search..."
              onValueChange={setInputValue}
              value={inputValue}
              className="ring-0 border-0 outline-none focus:border-0 focus:outline-none focus:ring-0"
            />
            <CommandList>
              <CommandItem
                value="toggle-select"
                onSelect={() => {
                  toggleSelectAll()
                  setOpen(false)
                }}
                className="text-right"
              >
                {getToggleLabel()}
              </CommandItem>
              <Separator />
              <CommandEmpty>{`No ${name}s found`}</CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    onSelect={() => toggleSelection(item.value)}
                    className="text-sm"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValues.includes(item.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {renderLabel ? renderLabel(item) : item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default MultipleComboBox
