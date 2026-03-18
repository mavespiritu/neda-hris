import axios from "axios"

const toKebabCase = (str) => {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

export const getCountries = () => {
  const url = `https://countriesnow.space/api/v0.1/countries/flag/images`
  return axios.get(url)
}

export const getProvinces = (payload) => {
  const url = route("psgc.provinces")
  return axios.get(url, { params: { ...payload } })
}

export const getMunicipalities = (payload) => {
  const { provinceCode } = payload
  const url = route("psgc.cities-municipalities", { provinceCode })
  return axios.get(url)
}

export const getBarangays = (payload) => {
  const { cityOrMunicipalityCode } = payload
  const url = route("psgc.barangays", { cityMunCode: cityOrMunicipalityCode })
  return axios.get(url)
}

export const getDistricts = (payload) => {
  const url = route("psgc.districts")
  return axios.get(url, { params: { ...payload } })
}

export const getDistrictCitymuns = (payload) => {
  const { districtCode } = payload
  const url = route("psgc.district-cities-municipalities", { districtCode })
  return axios.get(url)
}

export const getProvinceName = (provinceCode) => {
  return axios.get(route("psgc.province.show", { provinceCode }))
}

export const getCitymunName = (citymunCode) => {
  return axios.get(route("psgc.city-municipality.show", { cityMunCode: citymunCode }))
}

export const getBarangayName = (barangayCode) => {
  return axios.get(route("psgc.barangay.show", { barangayCode }))
}

export const getDistrictName = (provinceCode) => {
  return axios.get(route("psgc.district.show", { districtCode }))
}

export const getDistrictCitymunName = (citymunCode) => {
  return axios.get(route("psgc.district-city-municipality.show", { cityMunCode: citymunCode }))
}


export const getPds = async (payload) => {
  const url = route(`applicant.pds`)
  return axios.get(url, { params: { ...payload } })
}

export const getPdsSection = async (section, payload) => {
  const url = route(`applicant.${toKebabCase(section)}`)
  return axios.get(url, { params: { ...payload } })
}
