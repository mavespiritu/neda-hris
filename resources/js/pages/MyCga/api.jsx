import axios from "axios"

export const getTrainings = (payload) => {
    const url = `/trainings/`
    return axios.get(url, {params: {...payload}})
}

export const getCompetencies = (payload) => {
    const { emp_id } = payload
    const url = `/my-cga/competencies/${emp_id}`
    return axios.get(url, {params: {...payload}})
}

export const getSubmissions = (payload) => {
    const { emp_id } = payload
    const url = `/my-cga/histories/${emp_id}`
    return axios.get(url, {params: {...payload}})
}

export const getSelectedSubmission = (payload) => {
    const { id } = payload
    const url = `/review-cga/competencies-for-review/${id}`
    return axios.get(url, {params: {...payload}})
}

export const getIndicators = (payload) => {
    const { emp_id } = payload
    const url = `/my-cga/history-summary/competency/${emp_id}`
    return axios.get(url, {params: {...payload}})
}

export const getSummary = (payload) => {
    const { emp_id } = payload
    const url = `/my-cga/history-summary/${emp_id}`
    return axios.get(url, {params: {...payload}})
}

export const getProposedTrainings = (payload) => {
    const { emp_id } = payload
    const url = `/my-cga/proposed-trainings/${emp_id}`
    return axios.get(url, {params: {...payload}})
}

export const addProposedTraining = (payload) => {
    const { id } = payload
    const url = `/my-cga/proposed-trainings`
    return axios.post(url, payload)
}

export const editProposedTraining = (payload) => {
    const { id } = payload
    const url = `/my-cga/proposed-trainings/${id}`
    return axios.put(url, payload)
}

export const deleteProposedTraining = (payload) => {
    const { id } = payload
    const url = `/my-cga/proposed-trainings/${id}`
    
    return axios.delete(url)
}

export const sendEmailForCgaSubmission = (payload) => {
    const url = `/notification/submit-cga`
    return axios.post(url, payload)
}
