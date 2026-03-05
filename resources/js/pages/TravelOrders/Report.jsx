// Report.jsx
import { formatDate, formatDateRange } from "@/lib/utils.jsx"

const MIN_LINES = 7

const Report = ({ data, employees = {}, fundSources = [], approver }) => {
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

  // ---- Destination formatting ----
  const formatDestination = (d) => {
    if (!d) return ""

    if (d.type === "Local" || d.country === "Philippines") {
      const city = d.citymunName || d.citymun || ""
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

  // ---- employees map from backend (keyed by emp_id) ----
  const employeesMap =
    employees && !Array.isArray(employees) && typeof employees === "object" ? employees : {}

  const employeesById = Object.values(employeesMap).reduce((acc, e) => {
    acc[String(e.emp_id).trim()] = e
    return acc
  }, {})

  // data.staffs: [{ emp_id, recommender_id, approver_id }] (with fallback to old shape)
  const staffObjs = toArray(data?.staffs)
    .map((s) => {
      if (!s) return null
      if (typeof s === "string" || typeof s === "number") {
        return { emp_id: String(s).trim(), recommender_id: null, approver_id: null }
      }
      return {
        emp_id: s.emp_id != null ? String(s.emp_id).trim() : "",
        recommender_id: s.recommender_id != null ? String(s.recommender_id).trim() : null,
        approver_id: s.approver_id != null ? String(s.approver_id).trim() : null,
      }
    })
    .filter((s) => s && s.emp_id)

  const personnelLines = padLines(
    staffObjs.map((s) => employeesById[s.emp_id]?.name).filter(Boolean),
    MIN_LINES
  )

  const recommenderIds = staffObjs.map((s) => s.recommender_id).filter(Boolean)

  const recommendingUniqueIds = uniqueBy(recommenderIds, (id) => String(id).trim()).map((id) =>
    String(id).trim()
  )

  const recommendingLines = padLines(
    recommendingUniqueIds.map((id) => employeesById[id]?.name).filter(Boolean),
    MIN_LINES
  )

  // ✅ Fund source display from fundSources + data.fund_source_id
  const fundSourceText = (() => {
    const id = data?.fund_source_id ?? data?.fund_source ?? null
    if (id == null || id === "") return "\u00A0"

    const target = String(id).trim()

    const match = toArray(fundSources).find((fs) => {
      const v = fs?.value ?? fs?.id ?? fs?.key
      return v != null && String(v).trim() === target
    })

    const label = match?.label ?? match?.title ?? match?.name ?? match?.text
    return label && String(label).trim() ? String(label).trim() : "\u00A0"
  })()

  const LinedList = ({ lines }) => (
    <div
      className="
        w-full
        whitespace-pre-wrap break-words
        leading-[1.9]
        min-h-[13.3em]
        px-1
        text-xs
        bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(1.9em-1px),#000_calc(1.9em-1px),#000_1.9em)]
      "
    >
      {toArray(lines).join("\n")}
    </div>
  )

  return (
    <div className="hidden xl:flex flex-1 w-full h-full min-w-0">
      {/* ✅ gray canvas around the report */}
      <div className="flex-1 bg-muted/40 px-10 py-8 overflow-auto rounded-lg">
        {/* ✅ white paper report */}
        <div className="mx-auto max-w-[850px] bg-white shadow-lg border rounded-md p-10 break-words">
          <div className="w-full">
            {/* Header */}
            <div className="flex flex-col text-center text-sm">
              <div>Republic of the Philippines</div>
              <div className="font-semibold">
                DEPARTMENT OF ECONOMY, PLANNING, AND DEVELOPMENT
              </div>
              <div>Regional Office 1</div>
              <div>Guerrero Road, City of San Fernando, La Union</div>

              <div className="border-2 border-black px-2 py-1 font-semibold mx-auto text-center inline-block max-w-[70%] break-words whitespace-normal mt-4">
                TRAVEL ORDER NO. {data?.reference_no || ""}
              </div>
            </div>

            {/* Date */}
            <div className="flex flex-col mt-4">
              <div className="flex justify-end items-end gap-2">
                <small className="text-right whitespace-nowrap">Date:</small>
                <div className="border-b border-black w-[20%] text-xs text-center font-semibold">
                  {formatDate(data?.date_created) || ""}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-2 mt-4 text=xs">
              {/* To */}
              <div className="flex gap-2 items-end">
                <small className="whitespace-nowrap">To:</small>
                <div className="border-b border-black w-full">
                  <small className="font-semibold">CONCERNED STAFF</small>
                </div>
              </div>

              {/* Purpose */}
              <div className="flex gap-2 items-start min-w-0">
                <small className="whitespace-nowrap shrink-0 text-xs">Purpose:</small>
                <div className="w-full min-w-0">
                  <div
                    className="
                      block
                      text-xs
                      whitespace-pre-wrap break-words
                      leading-[1.9]
                      min-h-[5.7em]
                      px-1
                      bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(1.9em-1px),#000_calc(1.9em-1px),#000_1.9em)]
                    "
                  >
                    {data?.purpose?.trim() ? data.purpose : "\u00A0"}
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="flex gap-2 items-start min-w-0">
                <small className="whitespace-nowrap shrink-0 text-xs">Destination:</small>
                <div className="w-full min-w-0">
                  <div
                    className="
                      block
                      text-xs
                      whitespace-pre-wrap break-words
                      leading-[1.9]
                      min-h-[5.7em]
                      px-1
                      bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(1.9em-1px),#000_calc(1.9em-1px),#000_1.9em)]
                    "
                  >
                    {destinationsText}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer line */}
            <div className="mt-4 text-xs">
              <div>
                1. The following personnel of this Authority are hereby authorized to proceed to
                official destination on{" "}
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
                  {formatDateRange(data?.start_date, data?.end_date)}
                </span>
                .
              </div>
            </div>

            {/* Personnel + Recommending Approval */}
            <div className="flex gap-8 my-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs mb-2">PERSONNEL</div>
                <LinedList lines={personnelLines} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs mb-2">RECOMMENDING APPROVAL</div>
                <LinedList lines={recommendingLines} />
              </div>
            </div>

            <div className="text-xs mb-4">
              2. Per approved Itinerary of Travel, expenses are hereby authorized, subject to
              availability of funds and the usual accounting and auditing rules and regulations,
              chargeable against the fund of the:
            </div>

            <div className="flex justify-center font-semibold underline text-xs mb-4">
              {fundSourceText}
            </div>

            <div className="text-xs mb-4">
              3. Upon completion of the travel, the Certificate of Appearance, Certificate of Travel
              Completed and a Report on the purpose shall be submitted to the office.
            </div>

            <div className="font-semibold ml-32 mb-12 text-xs">APPROVED:</div>

            <div className="flex flex-col items-center text-xs">
              <div className="font-semibold underline">{approver?.name ?? ""}</div>
              <div>{approver?.designation ?? ""}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Report
