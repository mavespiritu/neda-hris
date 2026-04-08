import { useState, useEffect, useCallback, useMemo } from "react"
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
  onAdd,
  canAdd = false,
  excludeValues = [],
  value,
  selectedItem,
  invalidMessage,
  placeholder = "Search...",
  addLabel = "Add New Item",
  minSearchChars = 3,
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
  const [selectedLabel, setSelectedLabel] = useState("")
  const excludedValueSet = useMemo(() => new Set((excludeValues || []).filter(Boolean).map((item) => String(item))), [excludeValues])

  useEffect(() => {
    if (selectedItem) {
      setSelectedValue(selectedItem.value)
      setSelectedLabel(selectedItem.label)
    }
  }, [selectedItem])

  const fetchItems = useCallback(
    debounce(async (term) => {
      if (!term || term.length < minSearchChars) {
        setItems([])
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`${apiUrl}?search=${encodeURIComponent(term)}`)
        const data = await response.json()
        const rawItems = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
        setItems(
          rawItems
              .map((item) => ({
                ...item,
                value: item.value ?? item.id,
                label:
                  item.label ??
                  item.category ??
                  item.activity ??
                  item.target ??
                  item.name ??
                  item.title ??
                  String(item.id ?? ""),
              }))
            .filter((item) => !excludedValueSet.has(String(item.value)))
        )
      } catch (err) {
        console.error("Error fetching items:", err)
        setItems([])
      } finally {
        setLoading(false)
      }
    }, 500),
    [apiUrl, excludedValueSet, minSearchChars]
  )

  const handleSearch = (term) => {
    setSearchTerm(term)
    fetchItems(term)
  }

  // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Modified to include full item
  const toggleSelection = (currentValue, currentItem) => {
    if (disabled || loading) return
    const isSame = selectedValue === currentValue
    const newValue = isSame ? null : currentValue
    const newItem = isSame ? null : currentItem

    setSelectedValue(newValue)
    setSelectedLabel(newItem?.label || "")
    onChange(newValue, newItem) // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ pass both value & item
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
              "justify-between w-full relative h-auto min-h-10 items-start",
              invalidMessage ? "border-red-500" : ""
            )}
            onClick={() => !disabled && setOpen((prev) => !prev)}
            disabled={disabled}
          >
            <span
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 pr-2 text-left whitespace-normal break-words",
                labelWidth || "w-full",
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
                        onSelect={() => toggleSelection(item.value, item)} // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ include item
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
                ) : searchTerm.length >= minSearchChars ? (
                  <div className="space-y-2 p-2">
                    <CommandEmpty>No results found</CommandEmpty>
                    {canAdd && onAdd && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto w-full px-2 py-2 justify-center text-sm font-medium text-slate-900"
                        onClick={() => {
                          onAdd(searchTerm)
                          setOpen(false)
                        }}
                      >
                        {addLabel}
                      </Button>
                    )}
                  </div>
                ) : (
                  <CommandEmpty>Type at least {minSearchChars} characters...</CommandEmpty>
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


