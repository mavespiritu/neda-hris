import { useEffect, useMemo, useState } from "react"

/**
 * ResponsiveTabs
 *
 * props:
 * - tabs: [{ key, label, hash?, disabled?, hidden? }]
 * - value: active key
 * - onChange: (key) => void
 * - storageKey?: string (optional - if you want localStorage persistence here instead of parent)
 * - syncHash?: boolean (default true)
 * - fallbackKey?: string (default first available)
 * - orientation?: "vertical" | "horizontal"
 *
 * Notes:
 * - "availableTabs" are those not hidden and not disabled.
 * - If hash points to a hidden/disabled tab, it falls back + fixes hash.
 */
const ResponsiveTabs = ({
  tabs = [],
  value,
  onChange,
  syncHash = true,
  fallbackKey,
  className = "",
  tabClassName = "",
  activeTabClassName = "",
  orientation = "vertical",
}) => {
  const availableTabs = useMemo(() => {
    return (Array.isArray(tabs) ? tabs : []).filter((t) => !t?.hidden)
  }, [tabs])

  const selectableTabs = useMemo(() => {
    return availableTabs.filter((t) => !t?.disabled)
  }, [availableTabs])

  const keyToHash = useMemo(() => {
    const m = {}
    availableTabs.forEach((t) => {
      if (t?.hash) m[t.key] = String(t.hash).replace("#", "").toLowerCase()
    })
    return m
  }, [availableTabs])

  const hashToKey = useMemo(() => {
    const m = {}
    Object.entries(keyToHash).forEach(([k, h]) => (m[h] = k))
    return m
  }, [keyToHash])

  const normalizeHash = (h) => String(h || "").replace("#", "").trim().toLowerCase()

  const setHash = (hash) => {
    const newHash = `#${hash}`
    if (window.location.hash !== newHash) window.history.pushState(null, "", newHash)
  }

  const computedFallbackKey = useMemo(() => {
    if (fallbackKey && selectableTabs.some((t) => t.key === fallbackKey)) return fallbackKey
    return selectableTabs[0]?.key
  }, [fallbackKey, selectableTabs])

  // Ensure active tab is always valid (not hidden/disabled)
  useEffect(() => {
    if (!value) {
      if (computedFallbackKey) onChange?.(computedFallbackKey)
      return
    }

    const exists = availableTabs.some((t) => t.key === value)
    const isDisabled = availableTabs.some((t) => t.key === value && t.disabled)

    if (!exists || isDisabled) {
      if (computedFallbackKey) onChange?.(computedFallbackKey)
    }
  }, [value, availableTabs, computedFallbackKey, onChange])

  // Sync hash -> tab
  useEffect(() => {
    if (!syncHash) return
    if (!computedFallbackKey) return

    const applyHash = () => {
      const h = normalizeHash(window.location.hash)
      const desiredKey = hashToKey[h]

      const desiredTab = availableTabs.find((t) => t.key === desiredKey)

      // allow only if exists AND not disabled
      if (desiredTab && !desiredTab.disabled) {
        if (value !== desiredTab.key) onChange?.(desiredTab.key)
        return
      }

      // invalid hash -> ensure hash matches current valid tab
      const currentHash = keyToHash[value] || keyToHash[computedFallbackKey]
      if (currentHash) setHash(currentHash)
      if (!value) onChange?.(computedFallbackKey)
    }

    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [syncHash, hashToKey, availableTabs, value, onChange, keyToHash, computedFallbackKey])

  const handleSelect = (key) => {
    const tab = availableTabs.find((t) => t.key === key)
    if (!tab || tab.disabled) return

    onChange?.(key)

    if (syncHash && tab.hash) {
      setHash(String(tab.hash).replace("#", "").toLowerCase())
    }
  }

  const activeLabel = availableTabs.find((t) => t.key === value)?.label ?? "Select Tab"

  const [open, setOpen] = useState(false)

  return (
    <div className={className}>
      {/* Mobile dropdown */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full px-4 py-2 border rounded-md text-left bg-background shadow-sm"
        >
          {activeLabel}
        </button>

        {open && (
          <div className="mt-2 border rounded-md bg-background shadow-sm overflow-hidden">
            {availableTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                disabled={t.disabled}
                onClick={() => {
                  handleSelect(t.key)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed ${tabClassName}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop tabs */}
      <nav
        className={`hidden md:flex gap-2 ${
          orientation === "horizontal"
            ? "flex-row flex-wrap items-center"
            : "flex-col"
        }`}
      >
        {availableTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            disabled={t.disabled}
            onClick={() => handleSelect(t.key)}
            className={`text-left px-4 py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed ${tabClassName} ${
              value === t.key
                ? `bg-muted font-semibold ${activeTabClassName}`
                : "hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default ResponsiveTabs