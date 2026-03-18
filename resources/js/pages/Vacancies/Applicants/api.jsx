import axios from "axios"

const toKebabCase = (str) => {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

export const getCountries = () => {
    const url = `https://countriesnow.space/api/v0.1/countries/flag/images`
    return axios.get(url)
}

export const getProvinces = () => {
  return axios.get(route("psgc.provinces"))
}

export const getDistricts = () => {
  return axios.get(route("psgc.districts"))
}

export const getMunicipalities = ({ provinceCode, districtCode }) => {
  return axios.get(route("psgc.cities-municipalities"), {
    params: {
      ...(provinceCode ? { provinceCode } : {}),
      ...(districtCode ? { districtCode } : {}),
    },
  })
}

export const getBarangays = ({ cityOrMunicipalityCode }) => {
  return axios.get(route("psgc.barangays", { cityMunCode: cityOrMunicipalityCode }))
}

export const getDistrictName = async (districtCode) => {
  return axios.get(route("psgc.district.show", { districtCode }))
}

export const getProvinceName = async (provinceCode) => {
  return axios.get(route("psgc.province.show", { provinceCode }))
}

export const getCitymunName = async (citymunCode) => {
  return axios.get(route("psgc.city-municipality.show", { cityMunCode: citymunCode }))
}

export const getBarangayName = async (barangayCode) => {
  return axios.get(route("psgc.barangay.show", { barangayCode }))
}

export const getPds = async (id) => {

    const url = route(`vacancies.applicants.pds`, id)
    return axios.get(url)
}

