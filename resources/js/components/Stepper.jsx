"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Stepper({ steps, currentStep, onStepClick, className }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2">
              <Button
                variant={index <= currentStep ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-4 w-4 rounded-full transition-all duration-200",
                  index < currentStep && "bg-green-600 text-primary-foreground p-3",
                  index === currentStep && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  index > currentStep && "bg-muted text-muted-foreground hover:bg-muted/80",
                  onStepClick && index <= currentStep && "cursor-pointer hover:scale-105",
                )}
                onClick={() => {
                  if (onStepClick && index <= currentStep) {
                    onStepClick(index)
                  }
                }}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium"></span>
                )}
              </Button>
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    "flex items-center text-sm font-semibold transition-colors",
                    index < currentStep
                      ? "text-green-600"
                      : index === currentStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.icon}
                  {step.title}
                </div>
                {step.description && <p className="text-xs text-muted-foreground mt-1 max-w-24">{step.description}</p>}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 mx-4 border-t-2 transition-colors duration-200",
                  index < currentStep ? "border-green-600 border-solid" : "border-border border-dashed"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
