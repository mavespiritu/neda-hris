import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

const TextInput = (
  ({ name, type, value, onChange, isInvalid, ref }) => {
    return (
      <div ref={ref} className="w-full">
        <Input 
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