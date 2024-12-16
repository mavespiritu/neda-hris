import axios from "axios"

export const getCompetencies = (payload) => {
    const url = `/review-cga/competencies-for-review`
    return axios.get(url, {params: {...payload}})
}

export const getCompetenciesCount = () => {
    const url = `/review-cga/competencies-for-review/total`
    return axios.get(url)
}

export const getSelectedCompetency = (payload) => {
    const { id } = payload
    const url = `/review-cga/competencies-for-review/${id}`
    return axios.get(url, {params: {...payload}})
}

export const getIndicators = (payload) => {
    const { id } = payload
    const url = `/review-cga/competencies-for-review/competency/${id}`
    return axios.get(url, {params: {...payload}})
}

export const updateCompliance = (payload) => {
    const { id } = payload
    const url = `/review-cga/competencies-for-review/competency/${id}`
    return axios.post(url, payload)
}

export const updateRemarks = (payload) => {
    const { id } = payload
    const url = `/review-cga/competencies-for-review/indicator/${id}`
    return axios.post(url, payload)
}

export const approveCompetency = (payload) => {
    const { id } = payload
    const url = `/review-cga/competencies-for-review/approve/${id}`
    return axios.post(url, payload)
}

export const sendEmailForCgaApproval = (payload) => {
    const url = `/notification/approve-cga/`
    return axios.post(url, payload)
}