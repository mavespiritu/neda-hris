import PageTitle from "@/components/PageTitle"
import { Link, usePage } from "@inertiajs/react"
import { cn } from "@/lib/utils.jsx"

const navItems = [
  { label: "Overview", href: route("access-control.index") },
  { label: "Users", href: route("access-control.users") },
  { label: "Roles", href: route("access-control.roles") },
  { label: "Permissions", href: route("access-control.permissions") },
  { label: "Pages", href: route("access-control.pages") },
  { label: "Scope", href: route("access-control.scope") },
]

const SectionShell = ({ title, description, breadcrumbItems, children }) => {
  const { url } = usePage()

  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        pageTitle={title}
        description={description}
        breadcrumbItems={breadcrumbItems}
      />

      <div className="flex flex-wrap gap-2 rounded-xl border border-border/70 bg-background p-2">
        {navItems.map((item) => {
          const active = url === item.href || url.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}

export default SectionShell
