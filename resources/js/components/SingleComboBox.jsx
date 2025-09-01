import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
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
import { useState, useEffect } from "react"

const SingleComboBox = ({
  items,
  name,
  onChange,
  value,
  invalidMessage,
  placeholder,
  ref,
  width,
  labelWidth,
  className,
  disabled,
  loading = false,
}) => {
  const [open, setOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  const toggleSelection = (currentValue) => {
    if (disabled || loading) return
    const newValue = selectedValue === currentValue ? null : currentValue
    setSelectedValue(newValue)
    onChange(newValue)
    setOpen(false)
  }

  const clearSelection = () => {
    if (disabled || loading) return
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
            className={`justify-between w-full relative ${
              invalidMessage ? "border-red-500" : ""
            }`}
            onClick={() => !disabled && !loading && setOpen((prev) => !prev)}
            disabled={disabled || loading}
          >
            <span
              className={`text-left pr-2 flex items-center gap-2 ${
                labelWidth || `w-[380px]`
              } truncate overflow-hidden whitespace-nowrap ${
                !selectedValue ? "text-gray-700" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching options...
                </>
              ) : selectedValue ? (
                items.find((item) => item.value === selectedValue)?.label ??
                placeholder
              ) : (
                placeholder
              )}
            </span>
            <ChevronsUpDown className="ml-4 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        {!disabled && !loading && (
          <PopoverContent className={cn("p-0 w-[420px]", width)}>
            <Command>
              <CommandInput
                placeholder="Type to search..."
                className="ring-0 border-0 outline-none focus:ring-0 focus:border-0 focus:outline-none"
              />
              {selectedValue && (
                <div
                  className="text-sm font-medium cursor-pointer hover:underline p-2"
                  onClick={clearSelection}
                >
                  Deselect All
                </div>
              )}
              <CommandList>
                {items?.length ? (
                  <CommandGroup>
                    {items.map((item) => (
                      <CommandItem
                        key={item.label}
                        value={item.label}
                        onSelect={() => toggleSelection(item.value)}
                        className="text-sm"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedValue === item.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {item.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  <CommandEmpty>{`No ${name} found`}</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  )
}

export default SingleComboBox
