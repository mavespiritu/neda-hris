import { useState, useEffect, useMemo } from "react"
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
import useDebounce from "@/hooks/useDebounce"

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
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const excludedValueKey = useMemo(
    () => (excludeValues || []).filter(Boolean).map((item) => String(item)).join("\u0001"),
    [excludeValues]
  )
  const excludedValueSet = useMemo(
    () => new Set(excludedValueKey ? excludedValueKey.split("\u0001") : []),
    [excludedValueKey]
  )

  useEffect(() => {
    if (!selectedItem) return

    if (selectedItem.value !== undefined && String(selectedItem.value) !== String(selectedValue)) {
      setSelectedValue(selectedItem.value)
    }

    if (selectedItem.label !== undefined && selectedItem.label !== selectedLabel) {
      setSelectedLabel(selectedItem.label)
    }
  }, [selectedItem, selectedLabel, selectedValue])

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < minSearchChars) {
      setItems([])
      setLoading((current) => (current ? false : current))
      return
    }

    let active = true

    const fetchItems = async () => {
      try {
        setLoading(true)
        const joiner = apiUrl.includes("?") ? "&" : "?"
        const response = await fetch(`${apiUrl}${joiner}search=${encodeURIComponent(debouncedSearchTerm)}`)
        const data = await response.json()
        const rawItems = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []

        if (!active) return

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
        if (active) {
          console.error("Error fetching items:", err)
          setItems([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchItems()

    return () => {
      active = false
    }
  }, [apiUrl, debouncedSearchTerm, excludedValueSet, minSearchChars])

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
                selectedValue ? "text-slate-900 font-medium" : "text-gray-700"
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
                        className={cn(
                          "text-sm",
                          selectedValue === item.value &&
                            "bg-slate-100 font-medium text-slate-900 data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            selectedValue === item.value
                              ? "opacity-100 text-slate-700"
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
                  </div>
                ) : (
                  <CommandEmpty>Type at least {minSearchChars} characters...</CommandEmpty>
                )}
              </CommandList>
              {canAdd && onAdd && (
                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-center px-2 py-2 text-sm font-medium text-slate-900"
                    onClick={() => {
                      onAdd(searchTerm)
                      setOpen(false)
                    }}
                  >
                    {addLabel}
                  </Button>
                </div>
              )}
            </Command>
          </PopoverContent>
        )}
      </Popover>
    </div>
  )
}

export default SearchableComboBox


