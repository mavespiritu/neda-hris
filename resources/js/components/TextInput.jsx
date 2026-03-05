import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import React from "react"

const TextInput = React.forwardRef(
  ({ name, type = "text", value, onChange, isInvalid, disabled, readOnly, className }, ref) => {
    return (
      <div className="w-full">
        <Input
          ref={ref}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          disabled={disabled}
          className={cn(
            "w-full",
            isInvalid ? "border-red-500" : "",
            readOnly && !disabled ? "opacity-100 cursor-default" : "",
            className
          )}
        />
      </div>
    )
  }
)

TextInput.displayName = "TextInput"

export default TextInput
