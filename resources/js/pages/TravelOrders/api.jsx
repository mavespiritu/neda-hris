import axios from "axios"

export const getCountries = (payload) => {
    const url = 'https://countriesnow.space/api/v0.1/countries/flag/images'
    return axios.get(url, {params: {...payload}})
}

export const getProvinces = (payload) => {
    const url = route('psgc.provinces')
    return axios.get(url, {params: {...payload}})
}

export const getCitymuns = (payload) => {
    const url = route('psgc.cities-municipalities')
    return axios.get(url, {params: {...payload}})
}

export const getDistricts = (payload) => {
    const url = route('psgc.districts')
    return axios.get(url, {params: {...payload}})
}

export const getDistrictCitymuns = (payload) => {
    const url = route('psgc.cities-municipalities')
    return axios.get(url, {params: {...payload}})
}
