import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const LoadingOverlay = ({
  show = false,
  text = "",
  className = "",
  variant = "fixed", // "fixed" | "absolute"
  blur = true,
}) => {
  if (!show) return null

  const positionClass = variant === "absolute" ? "absolute inset-0" : "fixed inset-0"

  return (
    <div
      className={cn(
        positionClass,
        "z-50 flex items-center justify-center bg-black/30",
        blur ? "backdrop-blur-sm" : "",
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-white" />
        {text ? <p className="text-sm text-white">{text}</p> : null}
      </div>
    </div>
  )
}

export default LoadingOverlay