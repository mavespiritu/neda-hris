import { useEffect, useMemo, useState } from "react"
import { getOpcrActivities, getOpcrDivisions, getOpcrEmployees, getOpcrGroups } from "../api"

export default function useOpcrLookups() {
  const [activities, setActivities] = useState([])
  const [divisions, setDivisions] = useState([])
  const [groups, setGroups] = useState([])
  const [employees, setEmployees] = useState([])
  const [ppmpHierarchy, setPpmpHierarchy] = useState([])

  useEffect(() => {
    let mounted = true

    const extractRows = (payload, fallback = []) => {
      if (Array.isArray(payload)) return payload
      if (Array.isArray(payload?.data)) return payload.data
      if (Array.isArray(payload?.groups?.data)) return payload.groups.data
      return fallback
    }

    getOpcrActivities({ per_page: 200 })
      .then((response) => {
        if (!mounted) return
        const payload = response?.data ?? response
        setActivities(extractRows(payload))
      })
      .catch(() => {
        if (mounted) setActivities([])
      })

    getOpcrDivisions({ per_page: 200 })
      .then((response) => {
        if (!mounted) return
        const payload = response?.data ?? response
        setDivisions(extractRows(payload))
      })
      .catch(() => {
        if (mounted) setDivisions([])
      })

    getOpcrGroups({ per_page: 200 })
      .then((response) => {
        if (!mounted) return
        const payload = response?.data ?? response
        setGroups(extractRows(payload))
      })
      .catch(() => {
        if (mounted) setGroups([])
      })

    getOpcrEmployees({ emp_type_id: "Permanent" })
      .then((response) => {
        if (!mounted) return
        const payload = response?.data ?? response
        setEmployees(extractRows(payload))
      })
      .catch(() => {
        if (mounted) setEmployees([])
      })

    fetch(route("performance.ppmp.hierarchy"))
      .then((response) => response.json())
      .then((payload) => {
        if (!mounted) return
        setPpmpHierarchy(Array.isArray(payload) ? payload : [])
      })
      .catch(() => {
        if (mounted) setPpmpHierarchy([])
      })

    return () => {
      mounted = false
    }
  }, [])

  const activityItems = useMemo(
    () =>
      activities.map((activity) => ({
        value: String(activity.id),
        label: activity.activity_output,
      })),
    [activities]
  )

  const divisionItems = useMemo(
    () =>
      divisions.map((division) => ({
        value: String(division.value ?? division.division_id ?? ""),
        label: String(division.value ?? division.division_id ?? ""),
        item_no: division.item_no ?? null,
      })),
    [divisions]
  )

  const groupItems = useMemo(
    () =>
      groups.map((group) => ({
        value: String(group.id),
        label: group.name,
      })),
    [groups]
  )

  const employeeItems = useMemo(
    () =>
      employees.map((employee) => {
        const empId = String(employee.value ?? employee.emp_id ?? employee.id ?? "")
        return {
          value: `employee:${empId}`,
          label: employee.label ?? employee.name ?? employee.full_name ?? empId,
        }
      }),
    [employees]
  )

  const activityMap = useMemo(
    () => Object.fromEntries(activityItems.map((activity) => [String(activity.value), activity.label])),
    [activityItems]
  )

  const divisionMap = useMemo(
    () => Object.fromEntries(divisionItems.map((division) => [String(division.value), division.value])),
    [divisionItems]
  )

  const groupMap = useMemo(
    () => Object.fromEntries(groups.map((group) => [String(group.id), group.name])),
    [groups]
  )

  const employeeMap = useMemo(
    () =>
      Object.fromEntries(
        employees.map((employee) => {
          const key = String(employee.value ?? employee.emp_id ?? employee.id ?? "")
          const label = employee.label ?? employee.name ?? employee.full_name ?? employee.emp_id ?? key
          return [key, label]
        })
      ),
    [employees]
  )

  return {
    activities: activityItems,
    activityMap,
    divisions: divisionItems,
    groups: groupItems,
    employees: employeeItems,
    divisionMap,
    groupMap,
    employeeMap,
    ppmpHierarchy,
  }
}
