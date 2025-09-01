import axios from "axios"

export const getSubmissions = (payload) => {
    const url = route('cga.submissions')
    return axios.get(url, {params: {...payload}})
}

export const getSubmittedCompetencies = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.submissions.competencies', id)
    return axios.get(url, {params: {...rest}})
}

export const getSubmittedCompetencyIndicators = (payload) => {
    const { id } = payload
    const url = route('cga.submitted-competency-indicators', id)
    return axios.get(url, {params: {...payload}})
}

export const getSubmittedIndicatorEvidences = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.indicator-evidences', id)
    return axios.get(url, {params: {...rest}})
}

export const updateIndicatorInfo = (payload) => {
    const { id } = payload
    const url = route('cga.review.update-indicator', id)
    return axios.post(url, payload)
}

export const getSubmissionHistory = (payload) => {
    const { id } = payload
    const url = route('cga.review.history', id)
    return axios.get(url, {params: {...payload}})
}

export const notifyOfGapAnalysisEndorsement = (payload) => {
    const url = route('notification.endorse-gap-analysis')
    return axios.post(url, payload)
}

export const notifyOfGapAnalysisApproval = (payload) => {
    const url = route('notification.approve-gap-analysis')
    return axios.post(url, payload)
}

export const notifyOfGapAnalysisDisapproval = (payload) => {
    const url = route('notification.disapprove-gap-analysis')
    return axios.post(url, payload)
}
