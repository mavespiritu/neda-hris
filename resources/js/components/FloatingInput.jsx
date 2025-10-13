import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  ...props
}) {

  return (
    <div className="flex flex-col w-full relative">
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder=" " // required for peer-placeholder-shown trick
          className={cn(
            "peer h-14 px-3 pt-5 pb-2 border-none bg-muted",
            "focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-base"
          )}
          {...props}
        />
        <Label
          htmlFor={id}
          className={cn(
            "absolute left-3 transition-all duration-200 font-medium pointer-events-none",
            // State 1: empty + unfocused
            "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400",
            // State 2: focused OR has text
            value && value.length > 0 && "top-2 text-xs text-primary",
            "peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary",
            error && "text-red-500 peer-focus:text-red-500"
          )}
        >
          {label}
        </Label>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
