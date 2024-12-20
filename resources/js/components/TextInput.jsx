import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import React from 'react'

const TextInput = React.forwardRef(
  ({ name, type, value, onChange, isInvalid }, ref) => {
    return (
      <div className="w-full">
        <Input 
          ref={ref}
          type={type}
          name={name} 
          value={value} 
          onChange={onChange} 
          className={cn("w-full", isInvalid ? 'border-red-500' : '')} 
        />
      </div>
    )
  }
)

export default TextInput