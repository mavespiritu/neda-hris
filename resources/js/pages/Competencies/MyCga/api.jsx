import axios from "axios"

export const getEmployees = (payload) => {
    const url = route('employees')
    return axios.get(url, {params: {...payload}})
}

export const getCompetencies = (payload) => {
    const { id } = payload
    const url = route('cga.competencies', id)
    return axios.get(url, {params: {...payload}})
}

export const getCompetencyIndicators = (payload) => {
    const { id } = payload
    const url = route('cga.competency-indicators', id)
    return axios.get(url, {params: {...payload}})
}

export const updateCompetencyIndicator = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.update-competency-indicator', id)
    return axios.put(url, rest)
}

export const getIndicatorEvidences = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.indicator-evidences', id)
    return axios.get(url, {params: {...rest}})
}

export const getEvidence = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.evidence', id)
    return axios.get(url, {params: {...rest}})
}

export const getTrainings = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.trainings', id)
    return axios.get(url, {params: {...rest}})
}

export const getAwards = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.awards', id)
    return axios.get(url, {params: {...rest}})
}

export const getPerformances = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.performances', id)
    return axios.get(url, {params: {...rest}})
}

export const getDesignations = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.designations', id)
    return axios.get(url, {params: {...rest}})
}

export const getCareerPaths = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.career-paths', id)
    return axios.get(url, {params: {...rest}})
}

export const getCareerPathOptions = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.career-path-options', id)
    return axios.get(url, {params: {...rest}})
}

export const deleteCareerPath = (payload) => {
    const { id, ...data } = payload
    const url = route('cga.career-path.destroy', id)
    return axios.delete(url, {data})
}

export const getProposedTrainings = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.proposed-trainings', id)
    return axios.get(url, {params: {...rest}})
}

export const getTrainingOptions = (payload) => {
    const { id, ...rest } = payload
    const url = route('trainings.index', id)
    return axios.get(url, {params: {...rest}})
}

export const getSubmissions = (payload) => {
    const { id, ...rest } = payload
    const url = route('cga.submissions', id)
    return axios.get(url, {params: {...rest}})
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

export const getSubmissionWindow = (payload) => {
    const url = route('cga.submission-window')
    return axios.get(url, {params: {...payload}})
}

export const getGapAnalysis = (payload) => {
    const { id } = payload
    const url = route('cga.gap-analysis', id)
    return axios.get(url, {params: {...payload}})
}

export const notifyOfGapAnalysisSubmission = (payload) => {
    const url = route('notification.submit-gap-analysis')
    return axios.post(url, payload)
}
