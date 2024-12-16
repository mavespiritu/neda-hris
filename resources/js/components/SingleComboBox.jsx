import { Check, ChevronsUpDown, CircleX } from "lucide-react"
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
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

const SingleComboBox = (
  {
    items,
    name,
    onChange,
    value,
    invalidMessage,
    placeholder,
    ref,
    width,
    labelWidth,
    className
  }
) => {
  const [open, setOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  const toggleSelection = (currentValue) => {
    setSelectedValue((prevValue) => (prevValue === currentValue ? null : currentValue))
    setOpen(false) 
    onChange(currentValue === selectedValue ? null : currentValue)
  }

  const clearSelection = () => {
    setSelectedValue(null)
    onChange(null)
  }

  return (
    <div ref={ref} className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`justify-between w-full relative ${invalidMessage ? 'border-red-500' : ''}`}
            onClick={() => setOpen((prevOpen) => !prevOpen)}
          >
            <span className={`text-left pr-2 ${labelWidth || `w-[400px]`} truncate overflow-hidden text-ellipsis whitespace-nowrap`}>
              {selectedValue
                ? items.find((item) => item.value === selectedValue)?.label ?? placeholder
                : placeholder}
            </span>
            {selectedValue && (
              <CircleX
                className="absolute right-10 h-4 w-4 text-gray-500 cursor-pointer hover:text-black"
                onClick={(e) => {
                  e.stopPropagation() // Prevents the popover from toggling when clearing the selection
                  clearSelection()
                }}
              />
            )}
            <ChevronsUpDown className="ml-4 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("p-0 w-full", width)}>
          <Command>
            <CommandInput placeholder="Type to search..." className="ring-0 border-0 outline-none focus:ring-0 focus:border-0 focus:outline-none" />
            <CommandList>
              <CommandEmpty>{`No ${name} found`}</CommandEmpty>
              <CommandGroup>
                {items?.map((item) => (
                  <CommandItem
                    key={item.label}
                    value={item.label}
                    onSelect={() => toggleSelection(item.value)}
                    className="text-sm"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValue === item.value ? "opacity-100" : "opacity-0"
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

export default SingleComboBox
