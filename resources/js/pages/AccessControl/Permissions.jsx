import SectionShell from "./SectionShell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Access Control", href: "/access-control" },
  { label: "Permissions", href: "/access-control/permissions" },
]

const Permissions = ({ permissions }) => {
  return (
    <SectionShell
      title="Permission Management"
      description="Read-only permission catalogue with role and direct user counts."
      breadcrumbItems={breadcrumbItems}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Permissions</CardTitle>
          <CardDescription>
            This page shows the core permission names already stored in SSO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Guard</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Direct Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(permissions || []).length > 0 ? permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">{permission.name}</TableCell>
                    <TableCell>{permission.guard_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{permission.roles_count}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{permission.direct_users_count}</Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No permissions found.
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

export default Permissions
