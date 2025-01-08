import axios from "axios"

export const getCgaEnableUpdatingDates = (payload) => {
    const url = `/settings/cga-enable-updating`
    return axios.get(url, {params: {...payload}})
}