import axios from "axios"

export const getCountries = () => {
    const url = `https://countriesnow.space/api/v0.1/countries/flag/images`
    return axios.get(url)
}

export const getProvinces = (payload) => {

    const url = `https://psgc.gitlab.io/api/provinces/`
    return axios.get(url, {params: {...payload}})
}

export const getMunicipalities = (payload) => {
    const { provinceCode } = payload

    const url = `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`
    return axios.get(url)
}

export const getBarangays = (payload) => {
    const { cityOrMunicipalityCode } = payload

    const url = `https://psgc.gitlab.io/api/cities-municipalities/${cityOrMunicipalityCode}/barangays/`
    return axios.get(url)
}

export const getPds = (payload) => {

    const url = `/applicant/profile`
    return axios.get(url, {params: {...payload}})
}

export const getProvinceName = async (provinceCode)  => {
    const url = `https://psgc.gitlab.io/api/provinces/${provinceCode}/`;
    
    return axios.get(url)
}

export const getCitymunName = async (citymunCode)  => {
    const url = `https://psgc.gitlab.io/api/cities-municipalities/${citymunCode}/`;
    
    return axios.get(url)
}

export const getBarangayName = async (barangayCode)  => {
    const url = `https://psgc.gitlab.io/api/barangays/${barangayCode}/`;
    
    return axios.get(url)
}

