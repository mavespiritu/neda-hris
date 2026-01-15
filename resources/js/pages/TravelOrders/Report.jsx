
import { formatDate } from "@/lib/utils.jsx"
const Report = ({ data }) => {

    const formatDestination = (d) => {
    if (!d) return ""

    // Local
    if (d.type === "Local" || d.country === "Philippines") {
        const city = d.cityMunName || d.citymun || ""
        const prov = d.provinceName || d.province || ""
        // output: Location, City, Province
        return [d.location, city, prov].filter(Boolean).join(", ")
    }

    // International
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

  return (
    <div className="hidden xl:flex flex-col border rounded p-8 gap-y-6 h-full w-full min-w-0 break-words overflow-hidden">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col text-center">
          <small>Republic of the Philippines</small>
          <small className="font-semibold">
            NATIONAL ECONOMIC AND DEVELOPMENT AUTHORITY
          </small>
          <small>Regional Office 1</small>
          <small>Guerrero Road, City of San Fernando, La Union</small>

          {/* Line 5 (wrap-safe) */}
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

          {/* Purpose (wrap + keep underline) */}
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

          {/* Destination (wrap + keep underline) */}
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
                {travelDateText}
                </span>.
            </small>
        </div>
      </div>
    </div>
  )
}

export default Report
