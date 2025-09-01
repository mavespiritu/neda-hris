import React from 'react'
import { cn } from "@/lib/utils"

export function Fieldset({ legend, children, className, ...props }) {
  return (
    <fieldset 
      className={cn(
        "border border-gray-200 dark:border-gray-700 rounded-md p-4 space-y-4",
        className
      )}
      {...props}
    >
      <legend className="text-normal font-semibold px-2 bg-white dark:bg-gray-800">
        {legend}
      </legend>
      {children}
    </fieldset>
  )
}