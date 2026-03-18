import axios from "axios"

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

export const getPds = async (payload) => {
  return axios.get(route("applicants.pds"), { params: { ...payload } })
}

export const getPdsSection = async (section, payload) => {
  return axios.get(route("applicants.pds.section", { section }), { params: { ...payload } })
}

export const savePdsSection = async (section, payload) => {
  const data = {
    ...payload,
    step: section,
  }

  if (payload.applicantId) {
    return axios.put(route("applicants.update", { id: payload.applicantId }), data)
  }

  return axios.post(route("applicants.store"), data)
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
