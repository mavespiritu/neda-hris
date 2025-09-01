import axios from "axios"

export const getCgaEnableUpdatingDates = (payload) => {
    const url = `/settings/cga-enable-updating`
    return axios.get(url, {params: {...payload}})
}

export const getAccount = (payload) => {
    const url = route('settings.account')
    return axios.get(url, {params: {...payload}})
}

export const getOrganization = (payload) => {
    const url = route('settings.organization')
    return axios.get(url, {params: {...payload}})
}

export const getRecruitment = (payload) => {
    const url = route('settings.recruitment')
    return axios.get(url, {params: {...payload}})
}

export const getCgaSubmissionSchedules = (payload) => {
    const url = route('settings.cga.submission-schedules')
    return axios.get(url, {params: {...payload}})
}