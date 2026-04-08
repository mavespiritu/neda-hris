import SectionShell from "./SectionShell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Access Control", href: "/access-control" },
  { label: "Scope", href: "/access-control/scope" },
]

const Scope = ({ user, role_priorities }) => {
  const orderedPriorities = Object.entries(role_priorities || {})
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))

  return (
    <SectionShell
      title="Active Role / Scope"
      description="A planning view for the future module-scoped active role selector."
      breadcrumbItems={breadcrumbItems}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Current User</CardTitle>
          <CardDescription>
            This page shows the current direct roles and the suggested role order based on the configured priorities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-sm font-medium text-muted-foreground">Direct Roles</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(user?.direct_roles || []).length > 0 ? (
                  user.direct_roles.map((role) => <Badge key={role} variant="secondary">{role}</Badge>)
                ) : (
                  <span className="text-sm text-muted-foreground">No direct roles</span>
                )}
              </div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="text-sm font-medium text-muted-foreground">Effective Roles</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(user?.effective_roles || []).length > 0 ? (
                  user.effective_roles.map((role) => <Badge key={role}>{role}</Badge>)
                ) : (
                  <span className="text-sm text-muted-foreground">No effective roles</span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Recommended active role for this account:{" "}
            <span className="font-semibold text-foreground">
              {user?.recommended_role || "None"}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderedPriorities.length > 0 ? orderedPriorities.map(([role, priority]) => (
                  <TableRow key={role}>
                    <TableCell className="font-medium">{role}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{priority}</Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                      No priorities configured.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export default Scope
