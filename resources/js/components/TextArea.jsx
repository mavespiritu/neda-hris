import { cn } from "@/lib/utils"
import { Textarea } from "@/Components/ui/textarea"

const TextArea = (
  ({ name, value, onChange, invalidMessage, ref}) => {
    return (
      <div ref={ref} className="w-full">
        <Textarea 
          name={name} 
          value={value} 
          onChange={onChange} 
          className={cn("w-full min-h-36", invalidMessage ? 'border-red-500' : '')} 
        />
      </div>
    )
  }
)

export default TextArea