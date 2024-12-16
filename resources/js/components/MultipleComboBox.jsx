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
import { useState } from "react"
import { Separator } from "@/components/ui/separator"

const MultipleComboBox = (
    { 
        items,
        name,
        onChange,
        value = [],
        invalidMessage,
        placeholder,
        ref,
        width,
        labelWidth,
        className
   }
) => {
    
      const [open, setOpen] = useState(false)
      const [selectedValues, setSelectedValues] = useState(value)
      const [inputValue, setInputValue] = useState("")
    
      const toggleSelection = (currentValue) => {
        const updatedValues = selectedValues.includes(currentValue)
          ? selectedValues.filter((value) => value !== currentValue)
          : [...selectedValues, currentValue];
        setSelectedValues(updatedValues)
        onChange(updatedValues)
      }

      const toggleSelectAll = () => {
        const updatedValues =
          selectedValues.length === items.length
            ? []
            : items.map((item) => item.value);
        setSelectedValues(updatedValues)
        onChange(updatedValues)
      }

      const getToggleLabel = () => {
        return selectedValues.length === items.length ? 'Deselect All' : 'Select All';
      }
    
      const getButtonLabel = () => {
        if (selectedValues.length === 0) return `Choose ${name}s...`
        if (selectedValues.length === 1) {
          const selectedItem = items.find(
            (item) => item.value === selectedValues[0]
          )
          return selectedItem ? selectedItem.label : `Choose ${name}s...`
        }
        return `${selectedValues.length} selected`
      }

      const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(inputValue.toLowerCase())
      )

  return (
    <div ref={ref} className={className}>
      <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
          <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={`justify-between w-full ${invalidMessage ? 'border-red-500' : ''}`}
          >
              {getButtonLabel()}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
          </PopoverTrigger>
          <PopoverContent className={cn("p-0 w-full", width)}>
          <Command>
              <CommandInput 
                placeholder="Type to search..."
                onValueChange={setInputValue}
                value={inputValue}
                className="ring-0 border-0 outline-none focus:ring-0 focus:border-0 focus:outline-none"
              />
              <CommandList>
                <CommandItem
                  value="toggle-select"
                  onSelect={() => {
                    toggleSelectAll();
                    setOpen(false); // Close the popover after toggling
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
                      key={item.label}
                      value={item.label}
                      onSelect={() => {
                        toggleSelection(item.value)
                        // Do not close the popover on select
                      }}
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
                      {item.label}
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