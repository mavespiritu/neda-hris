import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

const TextArea = ({ invalidMessage, className, ...props }) => {
  return (
    <div className="w-full">
      <Textarea
        {...props}
        className={cn("w-full min-h-36", invalidMessage ? "border-red-500" : "", className)}
      />
    </div>
  )
}

export default TextArea
