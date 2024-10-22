import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from 'react'

const FileUpload = (
  ({ name, onFilesSelect, invalidMessage, ref }) => {

    const handleChange = (e) => {
        const files = Array.from(e.target.files)
        onFilesSelect(files)
      }

    return (
      <div ref={ref} className="w-full">
        <Input 
          name={name} 
          onChange={handleChange} 
          type="file"
          className={cn("w-full", invalidMessage ? 'border-red-500' : '')} 
          multiple
        />
      </div>
    )
  }
)

export default FileUpload