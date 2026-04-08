import axios from "axios"

export const getOpcrDivisions = (payload = {}) => {
  const url = route("performance.opcr.divisions")
  return axios.get(url, { params: { ...payload } })
}

export const getOpcrGroups = (payload = {}) => {
  const url = route("settings.groups.index")
  return axios.get(url, { params: { ...payload } })
}

export const getOpcrEmployees = (payload = {}) => {
  const url = route("employees.show-filtered-employees")
  return axios.get(url, { params: { ...payload } })
}

export const getOpcrActivities = (payload = {}) => {
  const url = route("performance.activities.index")
  return axios.get(url, { params: { ...payload } })
}
