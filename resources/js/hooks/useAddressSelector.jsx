import { useState } from "react"
import { getCountries, getProvinces, getMunicipalities, getBarangays } from "@/api/psgc"

export default function useAddressSelector() {
  const [countries, setCountries] = useState([])
  const [provinces, setProvinces] = useState([])
  const [citiesCache, setCitiesCache] = useState({})
  const [barangaysCache, setBarangaysCache] = useState({})

  const [loading, setLoading] = useState(false)

  // Initial load of countries
  const fetchCountries = async () => {
    if (countries.length > 0) return countries // already loaded
    setLoading(true)
    try {
      const { data } = await getCountries()
      setCountries(
        data.data?.map((p) => ({
          value: p.name,
          label: p.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
      )
    } finally {
      setLoading(false)
    }
  }

  // Initial load of provinces
  const fetchProvinces = async () => {
    if (provinces.length > 0) return provinces // already loaded
    setLoading(true)
    try {
      const { data } = await getProvinces()
      setProvinces(
        data.map((p) => ({
          value: p.code,
          label: p.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
      )
    } finally {
      setLoading(false)
    }
  }

  // Cities/Municipalities per province
  const fetchCities = async (provinceCode) => {
    if (!provinceCode) return []
    if (citiesCache[provinceCode]) return citiesCache[provinceCode]

    const { data } = await getMunicipalities({ provinceCode })
    const mapped = data.map((c) => ({
      value: c.code,
      label: c.name,
    }))

    setCitiesCache((prev) => ({ ...prev, [provinceCode]: mapped }))
    return mapped
  }

  // Barangays per city/municipality
  const fetchBarangays = async (cityOrMunicipalityCode) => {
    if (!cityOrMunicipalityCode) return []
    if (barangaysCache[cityOrMunicipalityCode])
      return barangaysCache[cityOrMunicipalityCode]

    const { data } = await getBarangays({ cityOrMunicipalityCode })
    const mapped = data.map((b) => ({
      value: b.code,
      label: b.name,
    }))

    setBarangaysCache((prev) => ({ ...prev, [cityOrMunicipalityCode]: mapped }))
    return mapped
  }

  return {
    countries,
    provinces,
    fetchCountries,
    fetchProvinces,
    fetchCities,
    fetchBarangays,
    loading,
  }
}
