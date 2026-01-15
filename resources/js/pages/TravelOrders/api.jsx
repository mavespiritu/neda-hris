import axios from "axios"

export const getCountries = (payload) => {
    const url = 'https://countriesnow.space/api/v0.1/countries/flag/images'
    return axios.get(url, {params: {...payload}})
}

export const getProvinces = (payload) => {
    const url = 'https://psgc.gitlab.io/api/provinces/'
    return axios.get(url, {params: {...payload}})
}

export const getCitymuns = (payload) => {
    const { provinceCode } = payload
    const url = `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`
    return axios.get(url, {params: {...payload}})
}