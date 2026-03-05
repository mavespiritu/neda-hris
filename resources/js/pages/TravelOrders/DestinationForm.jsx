import { useEffect, useMemo, useRef, useState } from "react"
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

import TextInput from "@/components/TextInput"
import SingleComboBox from "@/components/SingleComboBox"
import {
  getCountries,
  getProvinces,
  getCitymuns,
  getDistricts,
  getDistrictCitymuns,
} from "./api"

const DEFAULT_DESTINATION = {
  id: null,
  type: "Local",

  // local/international shared
  country: "Philippines",
  location: "",

  // local (province path)
  province: "",
  provinceName: "",

  // local (metro manila path)
  isMetroManila: false,
  district: "",
  districtName: "",

  // local (shared)
  citymun: "",
  citymunName: "",
}

const normalizeCountries = (raw) => {
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
  travelType = "Local", // "Local" or "Foreign"
  destinations = [],
  setDestinations,
  disabled = false,

  mode = "create", // "create" | "edit"
  open: openProp,
  onOpenChange,
  initialDraft = null,
  onSave,
}) => {
  const isControlled = typeof openProp === "boolean"
  const [openState, setOpenState] = useState(false)
  const open = isControlled ? openProp : openState

  const setOpen = (v) => {
    if (isControlled) onOpenChange?.(v)
    else setOpenState(v)
  }

  const isLocalTravel = travelType === "Local"

  const [draft, setDraft] = useState(DEFAULT_DESTINATION)

  const [countries, setCountries] = useState([])
  const [provinces, setProvinces] = useState([])
  const [districts, setDistrictsState] = useState([])
  const [citymuns, setCitymuns] = useState([])

  const [countriesLoading, setCountriesLoading] = useState(false)
  const [provincesLoading, setProvincesLoading] = useState(false)
  const [districtsLoading, setDistrictsLoading] = useState(false)
  const [citymunsLoading, setCitymunsLoading] = useState(false)

  const [countriesError, setCountriesError] = useState("")
  const [provincesError, setProvincesError] = useState("")
  const [districtsError, setDistrictsError] = useState("")
  const [citymunsError, setCitymunsError] = useState("")

  const hydratingRef = useRef(false)

  const patchDraft = (patch) => {
    setDraft((prev) => ({ ...(prev ?? DEFAULT_DESTINATION), ...patch }))
  }

  // Load picklists when dialog opens
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
      } catch {
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
        const normalized = normalizePSGC(raw)
        if (alive) setProvinces(normalized)
      } catch {
        if (alive) setProvincesError("Failed to load provinces.")
      } finally {
        if (alive) setProvincesLoading(false)
      }
    }

    const fetchDistricts = async () => {
      setDistrictsLoading(true)
      setDistrictsError("")
      try {
        const res = await getDistricts({})
        const raw = res?.data ?? []
        const normalized = normalizePSGC(raw)
        if (alive) setDistrictsState(normalized)
      } catch {
        if (alive) setDistrictsError("Failed to load districts.")
      } finally {
        if (alive) setDistrictsLoading(false)
      }
    }

    if (isLocalTravel) {
      // load whichever path is currently selected
      if (draft?.isMetroManila) fetchDistricts()
      else fetchProvinces()
    } else {
      fetchCountries()
    }

    return () => {
      alive = false
    }
    // include draft?.isMetroManila so it loads the correct list on open
  }, [open, isLocalTravel, draft?.isMetroManila])

  // Hydrate draft on open (create/edit) + force it to match travelType
  useEffect(() => {
    if (!open) return

    hydratingRef.current = true

    const base = {
      ...DEFAULT_DESTINATION,
      ...(initialDraft ?? {}),
    }

    if (isLocalTravel) {
      setDraft({
        ...base,
        type: "Local",
        country: "Philippines",
        // keep existing isMetroManila/province/district/citymun if editing
      })
    } else {
      setDraft({
        ...base,
        type: "International",
        country: base.country && base.country !== "Philippines" ? base.country : "",
        province: "",
        citymun: "",
        provinceName: "",
        district: "",
        districtName: "",
        isMetroManila: false,
        citymunName: "",
      })
      setCitymuns([])
      setCitymunsError("")
    }

    setTimeout(() => {
      hydratingRef.current = false
    }, 0)
  }, [open, mode, initialDraft, isLocalTravel])

  // When Metro Manila toggle changes, reset dependent fields + load correct picklist if needed
  useEffect(() => {
    if (!open) return
    if (!isLocalTravel) return
    if (hydratingRef.current) return

    const fetchDistricts = async () => {
      setDistrictsLoading(true)
      setDistrictsError("")
      try {
        const res = await getDistricts({})
        const raw = res?.data ?? []
        setDistrictsState(normalizePSGC(raw))
      } catch {
        setDistrictsError("Failed to load districts.")
      } finally {
        setDistrictsLoading(false)
      }
    }

    const fetchProvinces = async () => {
      setProvincesLoading(true)
      setProvincesError("")
      try {
        const res = await getProvinces({})
        const raw = res?.data ?? []
        setProvinces(normalizePSGC(raw))
      } catch {
        setProvincesError("Failed to load provinces.")
      } finally {
        setProvincesLoading(false)
      }
    }

    if (draft?.isMetroManila) {
      // switching to Metro Manila path
      patchDraft({
        province: "",
        provinceName: "Metro Manila",
        district: "",
        districtName: "",
        citymun: "",
        citymunName: "",
      })
      setCitymuns([])
      setCitymunsError("")
      if (!districts?.length && !districtsLoading) fetchDistricts()
    } else {
      // switching back to Province path
      patchDraft({
        province: "",
        provinceName: "",
        district: "",
        districtName: "",
        citymun: "",
        citymunName: "",
      })
      setCitymuns([])
      setCitymunsError("")
      if (!provinces?.length && !provincesLoading) fetchProvinces()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.isMetroManila, open, isLocalTravel])

  // Fetch city/mun when local + (province OR district) selected
  useEffect(() => {
    if (!open) return
    if (!isLocalTravel) return

    const isMM = !!draft?.isMetroManila
    const keyCode = isMM ? draft?.district : draft?.province

    if (!keyCode) {
      setCitymuns([])
      return
    }

    let alive = true

    const fetchCityMuns = async () => {
      setCitymunsLoading(true)
      setCitymunsError("")
      try {
        const res = isMM
          ? await getDistrictCitymuns({ districtCode: keyCode })
          : await getCitymuns({ provinceCode: keyCode })

        const raw = res?.data ?? []
        const normalized = normalizePSGC(raw)
        if (!alive) return

        setCitymuns(normalized)

        // Fill readable names if missing
        setDraft((prev) => {
          if (!prev) return prev

          const nextProvinceName =
            !isMM && prev.province && !String(prev.provinceName || "").trim()
              ? findLabel(provinces, prev.province)
              : prev.provinceName

          const nextDistrictName =
            isMM && prev.district && !String(prev.districtName || "").trim()
              ? findLabel(districts, prev.district)
              : prev.districtName

          const nextCitymunName =
            prev.citymun && !String(prev.citymunName || "").trim()
              ? findLabel(normalized, prev.citymun)
              : prev.citymunName

          return {
            ...prev,
            provinceName: nextProvinceName,
            districtName: nextDistrictName,
            citymunName: nextCitymunName,
          }
        })
      } catch {
        if (alive) setCitymunsError("Failed to load city/municipalities.")
      } finally {
        if (alive) setCitymunsLoading(false)
      }
    }

    fetchCityMuns()
    return () => {
      alive = false
    }
  }, [
    open,
    isLocalTravel,
    draft?.isMetroManila,
    draft?.province,
    draft?.district,
    provinces,
    districts,
  ])

  const canSave = useMemo(() => {
    if (!draft.location?.trim()) return false
    if (isLocalTravel) {
      if (draft?.isMetroManila) return !!draft.district && !!draft.citymun
      return !!draft.province && !!draft.citymun
    }
    return !!draft.country
  }, [draft, isLocalTravel])

  const handleSave = () => {
    if (!canSave) return

    const isMM = !!draft?.isMetroManila

    const payload = isLocalTravel
      ? {
          ...draft,
          type: "Local",
          country: "Philippines",
          location: draft.location.trim(),

          // province path
          province: isMM ? "" : draft.province,
          provinceName: isMM
            ? "Metro Manila"
            : draft.province
              ? (draft.provinceName || findLabel(provinces, draft.province))
              : "",

          // metro manila path
          district: isMM ? draft.district : "",
          districtName: isMM
            ? (draft.districtName || findLabel(districts, draft.district))
            : "",

          // shared
          citymunName: draft.citymun
            ? (draft.citymunName || findLabel(citymuns, draft.citymun))
            : "",
        }
      : {
          ...draft,
          type: "International",
          location: draft.location.trim(),
          province: "",
          citymun: "",
          provinceName: "",
          district: "",
          districtName: "",
          isMetroManila: false,
          citymunName: "",
        }

    if (mode === "edit") {
      onSave?.(payload)
      setOpen(false)
      return
    }

    setDestinations([...(destinations ?? []), payload])
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode !== "edit" && (
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={disabled}>
            Add Destination
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Destination" : "Add Destination"}</DialogTitle>
          <DialogDescription>
            {isLocalTravel
              ? "Specify the local destination of your travel."
              : "Specify the foreign destination of your travel."}
          </DialogDescription>
        </DialogHeader>

        {isLocalTravel ? (
          <div className="mt-4 space-y-4">
            {/* Metro Manila toggle */}
            <div className="flex items-center gap-2">
              <input
                id="isMetroManila"
                type="checkbox"
                className="h-4 w-4"
                checked={!!draft.isMetroManila}
                onChange={(e) => patchDraft({ isMetroManila: e.target.checked })}
              />
              <Label htmlFor="isMetroManila" className="cursor-pointer">
                Metro Manila (NCR)
              </Label>
            </div>

            {/* Province OR District */}
            {!draft.isMetroManila ? (
              <div className="space-y-1">
                <Label>Province</Label>
                {provincesError ? (
                  <p className="text-xs text-red-500">{provincesError}</p>
                ) : (
                  <SingleComboBox
                    items={provinces}
                    name="province"
                    value={draft.province}
                    onChange={(val) => {
                      patchDraft({
                        type: "Local",
                        country: "Philippines",
                        province: val,
                        provinceName: findLabel(provinces, val),
                        district: "",
                        districtName: "",
                        citymun: "",
                        citymunName: "",
                      })
                    }}
                    placeholder={provincesLoading ? "Loading..." : "Select province..."}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <Label>District</Label>
                {districtsError ? (
                  <p className="text-xs text-red-500">{districtsError}</p>
                ) : (
                  <SingleComboBox
                    items={districts}
                    name="district"
                    value={draft.district}
                    onChange={(val) => {
                      patchDraft({
                        type: "Local",
                        country: "Philippines",
                        province: "",
                        provinceName: "Metro Manila",
                        district: val,
                        districtName: findLabel(districts, val),
                        citymun: "",
                        citymunName: "",
                      })
                    }}
                    placeholder={districtsLoading ? "Loading..." : "Select district..."}
                  />
                )}
              </div>
            )}

            {/* City/Municipality */}
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
                    patchDraft({
                      citymun: val,
                      citymunName: findLabel(citymuns, val),
                    })
                  }
                  placeholder={
                    draft.isMetroManila
                      ? !draft.district
                        ? "Select a district first..."
                        : citymunsLoading
                          ? "Loading..."
                          : "Select city/municipality..."
                      : !draft.province
                        ? "Select a province first..."
                        : citymunsLoading
                          ? "Loading..."
                          : "Select city/municipality..."
                  }
                  disabled={draft.isMetroManila ? !draft.district : !draft.province}
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
                onChange={(e) => patchDraft({ location: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
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
                    patchDraft({
                      type: "International",
                      country: val,
                      province: "",
                      citymun: "",
                      provinceName: "",
                      district: "",
                      districtName: "",
                      isMetroManila: false,
                      citymunName: "",
                    })
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
                onChange={(e) => patchDraft({ location: e.target.value })}
              />
            </div>
          </div>
        )}

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
