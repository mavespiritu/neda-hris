import { Link } from "@inertiajs/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import SectionShell from "./SectionShell"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Access Control", href: "/access-control" },
]

const Index = ({ summary, current_user, sections }) => {
  return (
    <SectionShell
      title="Access Control"
      description="Read-only RBAC overview for users, roles, permissions, pages, and active scope."
      breadcrumbItems={breadcrumbItems}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Users", value: summary?.users ?? 0 },
          { label: "Roles", value: summary?.roles ?? 0 },
          { label: "Permissions", value: summary?.permissions ?? 0 },
          { label: "Pages", value: summary?.pages ?? 0 },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-3">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Current User Context</CardTitle>
          <CardDescription>
            This area helps us reason about the active role / scope model before we wire write actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-sm font-medium text-muted-foreground">Direct Roles</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(current_user?.direct_roles || []).length > 0 ? (
                  current_user.direct_roles.map((role) => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No direct roles</span>
                )}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-sm font-medium text-muted-foreground">Effective Roles</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(current_user?.effective_roles || []).length > 0 ? (
                  current_user.effective_roles.map((role) => (
                    <Badge key={role}>{role}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No effective roles</span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Recommended next step: connect an active-role selector so users with multiple roles can choose
            whether they are acting as Staff, HR, or management for a given module.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.route} href={section.route}>
            <Card className="h-full transition hover:border-primary/40 hover:shadow-md">
              <CardHeader>
                <CardDescription>{section.label}</CardDescription>
                <CardTitle className="text-lg">Open section</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Open the read-only {section.label.toLowerCase()} view.
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </SectionShell>
  )
}

export default Index
