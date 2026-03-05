import * as React from "react"
import { ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"

/**
 * Prevents Radix aria-hidden/focus anomaly by:
 * 1) Controlling menu open state
 * 2) Closing the menu BEFORE executing the action
 * 3) Executing the action on next frame (menu unmounts, focus released)
 *
 * actions: [
 *  { key, label, onSelect, hidden, disabled, destructive, separatorBefore }
 * ]
 */
export default function DropdownActions({
  triggerLabel = (
    <>
      Actions <ChevronDown className="h-4 w-4" />
    </>
  ),
  menuLabel = "Actions",
  align = "end",
  widthClassName = "w-56",
  actions = [],
  buttonProps = { variant: "outline", size: "sm" },
}) {
  const [open, setOpen] = React.useState(false)

  const runSafely = (fn) => {
    // Close first so Radix isn't trying to aria-hide a focused menu
    setOpen(false)

    // Next frame ensures DropdownMenuContent unmounts before you open Dialog/Drawer/etc.
    requestAnimationFrame(() => {
      if (typeof fn === "function") fn()
    })
  }

  const visibleActions = actions.filter((a) => !a?.hidden)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button {...buttonProps}>
          {triggerLabel}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className={widthClassName}>
        {menuLabel ? <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel> : null}

        <DropdownMenuGroup>
          {visibleActions.map((a) => (
            <React.Fragment key={a.key}>
              {a.separatorBefore ? <DropdownMenuSeparator /> : null}

              <DropdownMenuItem
                disabled={!!a.disabled}
                className={
                  a.destructive ? "text-destructive focus:text-destructive" : ""
                }
                // IMPORTANT: do NOT e.preventDefault() here
                onSelect={() => runSafely(a.onSelect)}
              >
                {a.label}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
