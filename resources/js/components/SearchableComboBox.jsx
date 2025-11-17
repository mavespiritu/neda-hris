import { useState, useEffect, useCallback } from "react"
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

// Debounce utility to delay API calls
const debounce = (fn, delay) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const SearchableComboBox = ({
  name,
  onChange,
  value,
  selectedItem,
  invalidMessage,
  placeholder = "Search...",
  ref,
  width,
  labelWidth,
  className,
  disabled,
  apiUrl,
}) => {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value)
  const [selectedLabel, setSelectedLabel] = useState("") // ✅ store label to persist visible text

  useEffect(() => {
    if (selectedItem) {
      setSelectedValue(selectedItem.value)
      setSelectedLabel(selectedItem.label)
    }
  }, [selectedItem])

  const fetchItems = useCallback(
    debounce(async (term) => {
      if (!term || term.length < 3) {
        setItems([])
        return
      }
      try {
        setLoading(true)
        const response = await fetch(`${apiUrl}?search=${encodeURIComponent(term)}`)
        const data = await response.json()
        setItems(data)
      } catch (err) {
        console.error("Error fetching items:", err)
        setItems([])
      } finally {
        setLoading(false)
      }
    }, 500),
    [apiUrl]
  )

  const handleSearch = (term) => {
    setSearchTerm(term)
    fetchItems(term)
  }

  // ✅ Modified to include full item
  const toggleSelection = (currentValue, currentItem) => {
    if (disabled || loading) return
    const isSame = selectedValue === currentValue
    const newValue = isSame ? null : currentValue
    const newItem = isSame ? null : currentItem

    setSelectedValue(newValue)
    setSelectedLabel(newItem?.label || "")
    onChange(newValue, newItem) // ✅ pass both value & item
    setOpen(false)
  }

  const clearSelection = () => {
    if (disabled || loading) return
    setSelectedValue(null)
    setSelectedLabel("")
    onChange(null, null)
  }

  return (
    <div ref={ref} className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "justify-between w-full relative",
              invalidMessage ? "border-red-500" : ""
            )}
            onClick={() => !disabled && setOpen((prev) => !prev)}
            disabled={disabled}
          >
            <span
              className={cn(
                "text-left pr-2 flex items-center gap-2 truncate overflow-hidden whitespace-nowrap",
                labelWidth || "w-[380px]",
                !selectedValue && "text-gray-700"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : selectedValue ? (
                selectedLabel ||
                items.find((i) => i.value === selectedValue)?.label ||
                placeholder
              ) : (
                placeholder
              )}
            </span>
            <ChevronsUpDown className="ml-4 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        {!disabled && (
          <PopoverContent className={cn("p-0 w-[420px]", width)}>
            <Command>
              <CommandInput
                value={searchTerm}
                onValueChange={handleSearch}
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
                {loading ? (
                  <div className="flex justify-center items-center p-4 text-gray-500 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </div>
                ) : items?.length ? (
                  <CommandGroup>
                    {items.map((item) => (
                      <CommandItem
                        key={item.value}
                        value={item.label}
                        onSelect={() => toggleSelection(item.value, item)} // ✅ include item
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
                ) : searchTerm.length >= 3 ? (
                  <CommandEmpty>No results found</CommandEmpty>
                ) : (
                  <CommandEmpty>Type at least 3 characters...</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  )
}

export default SearchableComboBox
