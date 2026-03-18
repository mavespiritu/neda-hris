import axios from "axios"

const toKebabCase = (str) => {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

const sectionStoreRoutes = {
  personalInformation: "profile.store-personal-information",
  familyBackground: "profile.store-family-background",
  educationalBackground: "profile.store-educational-background",
  civilServiceEligibility: "profile.store-civil-service-eligibility-section",
  workExperience: "profile.store-work-experience-section",
  voluntaryWork: "profile.store-voluntary-work-section",
  learningAndDevelopment: "profile.store-learning-and-development-section",
  otherInformation: "profile.store-other-information",
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

export const getPds = async (payload) => {
  const url = route("applicant.pds")
  return axios.get(url, { params: { ...payload } })
}

export const getPdsSection = async (section, payload) => {
  const url = route(`profile.${toKebabCase(section)}`)
  return axios.get(url, { params: { ...payload } })
}

export const savePdsSection = async (section, payload) => {
  const routeName = sectionStoreRoutes[section]

  if (!routeName) {
    throw new Error(`No save route configured for section: ${section}`)
  }

  return axios.post(route(routeName), payload)
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
