import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import TextInput from "@/components/TextInput"
import SingleComboBox from "@/components/SingleComboBox"

// ✅ your api functions
import { getCountries, getProvinces, getCitymuns } from "./api"

const DEFAULT_DESTINATION = {
  type: "Local", // "Local" | "International"
  country: "Philippines",

  // store codes
  province: "",
  citymun: "",

  // store names (for display)
  provinceName: "",
  cityMunName: "",

  location: "",
}

const normalizeCountries = (raw) => {
  // countriesnow returns { data: [...] } usually
  const arr = Array.isArray(raw) ? raw : []
  return arr
    .map((c) => {
      const name = c?.name ?? c?.country ?? c?.label
      if (!name) return null
      return { value: name, label: name }
    })
    .filter(Boolean)
    .sort((a, b) => a.label.localeCompare(b.label))
}

const normalizePSGC = (raw) => {
  const arr = Array.isArray(raw) ? raw : []
  return arr
    .map((x) => {
      const value = x?.code ?? x?.value
      const label = x?.name ?? x?.label
      if (!value || !label) return null
      return { value, label }
    })
    .filter(Boolean)
    .sort((a, b) => a.label.localeCompare(b.label))
}

const findLabel = (items, value) =>
  items?.find((i) => String(i.value) === String(value))?.label ?? ""

const DestinationForm = ({
  destinations = [],
  setDestinations, // (newArr) => setData("destinations", newArr)
  disabled = false,
}) => {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("local")
  const [draft, setDraft] = useState(DEFAULT_DESTINATION)

  const [countries, setCountries] = useState([])
  const [provinces, setProvinces] = useState([])
  const [citymuns, setCitymuns] = useState([])

  const [countriesLoading, setCountriesLoading] = useState(false)
  const [provincesLoading, setProvincesLoading] = useState(false)
  const [citymunsLoading, setCitymunsLoading] = useState(false)

  const [countriesError, setCountriesError] = useState("")
  const [provincesError, setProvincesError] = useState("")
  const [citymunsError, setCitymunsError] = useState("")

  // Reset draft when dialog opens
  useEffect(() => {
    if (!open) return

    setTab("local")
    setDraft({
      ...DEFAULT_DESTINATION,
      type: "Local",
      country: "Philippines",
    })

    setCitymuns([])
    setCitymunsError("")
  }, [open])

  // Fetch countries + provinces ONLY WHEN OPEN
  useEffect(() => {
    if (!open) return

    let alive = true

    const fetchCountries = async () => {
      setCountriesLoading(true)
      setCountriesError("")
      try {
        const res = await getCountries({})
        const raw = res?.data?.data ?? res?.data ?? []
        const normalized = normalizeCountries(raw)
        if (alive) setCountries(normalized)
      } catch (e) {
        if (alive) setCountriesError("Failed to load countries.")
      } finally {
        if (alive) setCountriesLoading(false)
      }
    }

    const fetchProvinces = async () => {
      setProvincesLoading(true)
      setProvincesError("")
      try {
        const res = await getProvinces({})
        const raw = res?.data ?? []
        const normalized = normalizePSGC(raw) // ✅ sorted by name
        if (alive) setProvinces(normalized)
      } catch (e) {
        if (alive) setProvincesError("Failed to load provinces.")
      } finally {
        if (alive) setProvincesLoading(false)
      }
    }

    fetchCountries()
    fetchProvinces()

    return () => {
      alive = false
    }
  }, [open])

  // Fetch city/mun ONLY WHEN OPEN + LOCAL + province selected
  useEffect(() => {
    if (!open) return
    if (tab !== "local") return
    if (!draft.province) {
      setCitymuns([])
      return
    }

    let alive = true

    const fetchCityMuns = async () => {
      setCitymunsLoading(true)
      setCitymunsError("")
      try {
        const res = await getCitymuns({ provinceCode: draft.province })
        const raw = res?.data ?? []
        const normalized = normalizePSGC(raw) // ✅ sorted by name
        if (alive) setCitymuns(normalized)
      } catch (e) {
        if (alive) setCitymunsError("Failed to load city/municipalities.")
      } finally {
        if (alive) setCitymunsLoading(false)
      }
    }

    fetchCityMuns()

    return () => {
      alive = false
    }
  }, [open, tab, draft.province])

  // When province changes, clear citymun + names
  useEffect(() => {
    if (!open) return
    setDraft((prev) => ({
      ...prev,
      citymun: "",
      cityMunName: "",
      provinceName: prev.province ? prev.provinceName : "",
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.province])

  const canSave = useMemo(() => {
    if (!draft.location?.trim()) return false

    if (draft.type === "Local") {
      return !!draft.province && !!draft.citymun
    }
    return !!draft.country
  }, [draft])

  const handleTabChange = (value) => {
    setTab(value)

    if (value === "local") {
      setDraft({
        ...DEFAULT_DESTINATION,
        type: "Local",
        country: "Philippines",
      })
    } else {
      setDraft({
        ...DEFAULT_DESTINATION,
        type: "International",
        country: "",
      })
    }

    setCitymuns([])
    setCitymunsError("")
  }

  const handleSave = () => {
    if (!canSave) return

    // ✅ resolve names from options (no extra fetch)
    const provinceName = draft.province ? findLabel(provinces, draft.province) : ""
    const cityMunName = draft.citymun ? findLabel(citymuns, draft.citymun) : ""

    const payload = {
      ...draft,
      location: draft.location.trim(),

      // ensure names are saved (for display)
      provinceName,
      cityMunName,
    }

    setDestinations([...(destinations ?? []), payload])
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}>
          Add Destination
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add Destination</DialogTitle>
          <DialogDescription>
            Specify the destination of your travel. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="local">Local</TabsTrigger>
            <TabsTrigger value="international">International</TabsTrigger>
          </TabsList>

          {/* LOCAL */}
          <TabsContent value="local" className="mt-4 space-y-4">
            <div className="space-y-1">
              <Label>Province</Label>
              {provincesError ? (
                <p className="text-xs text-red-500">{provincesError}</p>
              ) : (
                <SingleComboBox
                  items={provinces}
                  name="province"
                  value={draft.province}
                  onChange={(val) =>
                    setDraft((prev) => ({
                      ...prev,
                      type: "Local",
                      country: "Philippines",
                      province: val,
                      provinceName: findLabel(provinces, val),
                      citymun: "",
                      cityMunName: "",
                    }))
                  }
                  placeholder={provincesLoading ? "Loading..." : "Select province..."}
                />
              )}
            </div>

            <div className="space-y-1">
              <Label>City/Municipality</Label>
              {citymunsError ? (
                <p className="text-xs text-red-500">{citymunsError}</p>
              ) : (
                <SingleComboBox
                  items={citymuns}
                  name="city/municipality"
                  value={draft.citymun}
                  onChange={(val) =>
                    setDraft((prev) => ({
                      ...prev,
                      citymun: val,
                      cityMunName: findLabel(citymuns, val),
                    }))
                  }
                  placeholder={
                    !draft.province
                      ? "Select a province first..."
                      : citymunsLoading
                      ? "Loading..."
                      : "Select city/municipality..."
                  }
                  disabled={!draft.province}
                />
              )}
            </div>

            <div className="space-y-1">
              <Label>Specific Location</Label>
              <TextInput
                name="location"
                type="text"
                placeholder="e.g., Office / Barangay / Hotel / Venue"
                value={draft.location}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>
          </TabsContent>

          {/* INTERNATIONAL */}
          <TabsContent value="international" className="mt-4 space-y-4">
            <div className="space-y-1">
              <Label>Country</Label>
              {countriesError ? (
                <p className="text-xs text-red-500">{countriesError}</p>
              ) : (
                <SingleComboBox
                  items={countries}
                  name="country"
                  value={draft.country}
                  onChange={(val) =>
                    setDraft((prev) => ({
                      ...prev,
                      type: "International",
                      country: val,
                      // clear local fields
                      province: "",
                      citymun: "",
                      provinceName: "",
                      cityMunName: "",
                    }))
                  }
                  placeholder={countriesLoading ? "Loading..." : "Select country..."}
                />
              )}
            </div>

            <div className="space-y-1">
              <Label>Specific Location</Label>
              <TextInput
                name="location"
                type="text"
                placeholder="e.g., Office / Hotel / Venue"
                value={draft.location}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Discard
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DestinationForm
