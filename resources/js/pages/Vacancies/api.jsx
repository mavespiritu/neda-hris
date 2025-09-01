import axios from "axios"

export const getVacancies = (payload) => {
    const url = `/vacancies`
    return axios.get(url, {params: {...payload}})
}

export const getSelectedVacancy = (payload) => {
    const { id } = payload
    const url = `/vacancies/${id}`
    return axios.get(url, {params: {...payload}})
}

export const getPositions = (payload) => {
    const url = `/vacancies/positions`
    return axios.get(url, {params: {...payload}})
}

export const getCompetencies = (payload) => {
    const url = `/vacancies/competencies`
    return axios.get(url, {params: {...payload}})
}


export const getCompetenciesPerPosition = (payload) => {
    const { id } = payload
    const url = `/vacancies/${id}/competencies`
    return axios.get(url)
}
