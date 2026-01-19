// Report.jsx
import { formatDate } from "@/lib/utils.jsx"

const MIN_LINES = 7

const Report = ({ data, employees = {} }) => {
  const toArray = (v) => (Array.isArray(v) ? v : [])

  const uniqueBy = (arr, keyFn) => {
    const seen = new Set()
    const out = []
    for (const item of toArray(arr)) {
      const k = keyFn(item)
      if (!k || seen.has(k)) continue
      seen.add(k)
      out.push(item)
    }
    return out
  }

  const padLines = (lines, min = MIN_LINES) => {
    const clean = toArray(lines).map((s) => (s ?? "").toString())
    while (clean.length < min) clean.push("\u00A0")
    return clean
  }

  // ---- Destination formatting (your existing logic) ----
  const formatDestination = (d) => {
    if (!d) return ""

    if (d.type === "Local" || d.country === "Philippines") {
      const city = d.cityMunName || d.citymun || ""
      const prov = d.provinceName || d.province || ""
      return [d.location, city, prov].filter(Boolean).join(", ")
    }

    return [d.location, d.country].filter(Boolean).join(", ")
  }

  const destinationsText = (() => {
    const list = Array.isArray(data?.destinations) ? data.destinations : []
    const cleaned = list
      .map(formatDestination)
      .map((s) => (s || "").trim())
      .filter(Boolean)

    if (cleaned.length === 0) return "\u00A0"
    if (cleaned.length === 1) return cleaned[0]
    return cleaned.map((txt, idx) => `(${idx + 1}) ${txt}`).join("\n")
  })()

  const travelDateText = (() => {
    const start = data?.start_date ? formatDate(data.start_date) : ""
    const end = data?.end_date ? formatDate(data.end_date) : ""

    if (!start && !end) return ""
    if (start && end) return start === end ? start : `${start} to ${end}`
    return start || end
  })()

  // ---- Build employeesById map from backend employees object ----
  const employeesMap =
    employees && !Array.isArray(employees) && typeof employees === "object" ? employees : {}

  const employeesById = Object.values(employeesMap).reduce((acc, e) => {
    acc[String(e.emp_id).trim()] = e
    return acc
  }, {})

  // data.staffs is array of emp_id strings
  const selectedIds = (Array.isArray(data?.staffs) ? data.staffs : [])
    .map((id) => String(id).trim())
    .filter(Boolean)

  const selectedEmployees = selectedIds
    .map((id) => employeesById[id])
    .filter(Boolean)

  const personnelLines = padLines(
    selectedEmployees.map((e) => e.name).filter(Boolean),
    MIN_LINES
  )

  const recommendingRaw = selectedEmployees.map((e) => e.recommending).filter(Boolean)

  const recommendingUnique = uniqueBy(recommendingRaw, (r) =>
    String(r.emp_id ?? r.name ?? "").trim()
  )

  const recommendingLines = padLines(
    recommendingUnique.map((r) => r.name).filter(Boolean),
    MIN_LINES
  )

  const LinedList = ({ lines }) => (
    <div
      className="
        w-full
        whitespace-pre-wrap break-words
        leading-[1.9]
        min-h-[13.3em]
        px-1
        text-sm
        bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(1.9em-1px),#000_calc(1.9em-1px),#000_1.9em)]
      "
    >
      {toArray(lines).join("\n")}
    </div>
  )

  return (
    <div className="hidden xl:flex flex-col border rounded p-8 gap-y-6 h-full w-full min-w-0 break-words overflow-hidden">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col text-center">
          <small>Republic of the Philippines</small>
          <small className="font-semibold">
            DEPARTMENT OF ECONOMY, PLANNING, AND DEVELOPMENT
          </small>
          <small>Regional Office 1</small>
          <small>Guerrero Road, City of San Fernando, La Union</small>

          <small className="border-2 border-black p-1 mt-2 font-semibold mx-auto text-center inline-block max-w-[70%] break-words whitespace-normal">
            TRAVEL ORDER NO.
          </small>
        </div>

        {/* Date */}
        <div className="flex flex-col mt-4">
          <div className="flex justify-end items-end gap-2">
            <small className="text-right whitespace-nowrap">Date:</small>
            <div className="border-b border-black w-[20%] text-xs text-center font-semibold">
              {data?.date_created || ""}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2 mt-4">
          {/* To */}
          <div className="flex gap-2 items-end">
            <small className="whitespace-nowrap">To:</small>
            <div className="border-b border-black w-full">
              <small className="font-semibold">CONCERNED STAFF</small>
            </div>
          </div>

          {/* Purpose */}
          <div className="flex gap-2 items-start min-w-0">
            <small className="whitespace-nowrap shrink-0">Purpose:</small>
            <div className="w-full min-w-0">
              <small
                className="
                  block
                  whitespace-pre-wrap break-words
                  leading-[1.9]
                  min-h-[5.7em]
                  px-1
                  bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(1.9em-1px),#000_calc(1.9em-1px),#000_1.9em)]
                "
              >
                {data?.purpose?.trim() ? data.purpose : "\u00A0"}
              </small>
            </div>
          </div>

          {/* Destination */}
          <div className="flex gap-2 items-start min-w-0">
            <small className="whitespace-nowrap shrink-0">Destination:</small>
            <div className="w-full min-w-0">
              <small
                className="
                  block
                  whitespace-pre-wrap break-words
                  leading-[1.9]
                  min-h-[5.7em]
                  px-1
                  bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(1.9em-1px),#000_calc(1.9em-1px),#000_1.9em)]
                "
              >
                {destinationsText}
              </small>
            </div>
          </div>
        </div>

        {/* Footer line */}
        <div className="mt-4">
          <small>
            1. The following personnel of this Authority are hereby authorized to proceed to official
            destination on{" "}
            <span
              className="
                font-semibold
                inline-block
                border-b border-black
                min-w-[110px]
                px-1
                text-center
                whitespace-nowrap
              "
            >
              {travelDateText}
            </span>
            .
          </small>
        </div>

        {/* Personnel + Recommending Approval */}
        <div className="flex gap-8 mt-4">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm mb-2">PERSONNEL</div>
            <LinedList lines={personnelLines} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm mb-2">RECOMMENDING APPROVAL</div>
            <LinedList lines={recommendingLines} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Report
