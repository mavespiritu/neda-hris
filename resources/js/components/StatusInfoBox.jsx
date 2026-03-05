export default function StatusInfoBox({
  status,
  message,
  color, // optional override
  className = "",
}) {
  const normalized = String(status || "").trim().toLowerCase()

  const colorMap = {
    green: "bg-green-50 text-green-700 border-green-400",
    red: "bg-red-50 text-red-700 border-red-400",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-400",
    blue: "bg-blue-50 text-blue-700 border-blue-400",
    gray: "bg-muted text-foreground border-muted-foreground/30",
  }

  const statusClass = (() => {
    // If color prop is provided, use it first
    if (color && colorMap[color]) {
      return colorMap[color]
    }

    // Otherwise fallback to status-based logic
    if (normalized === "approved") {
      return colorMap.green
    }

    if (normalized === "disapproved" || normalized === "disapprove") {
      return colorMap.red
    }

    if (normalized === "needs revision") {
      return colorMap.yellow
    }

    return colorMap.gray
  })()

  return (
    <div
      className={`rounded-md p-3 text-xs flex flex-col gap-1 border-l-4 ${statusClass} ${className}`}
    >
      {message || "\u00A0"}
    </div>
  )
}