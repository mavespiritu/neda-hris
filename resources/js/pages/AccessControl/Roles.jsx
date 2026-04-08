import SectionShell from "./SectionShell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Access Control", href: "/access-control" },
  { label: "Roles", href: "/access-control/roles" },
]

const Roles = ({ roles }) => {
  return (
    <SectionShell
      title="Role Management"
      description="Read-only roles catalogue with hierarchy priority and usage counts."
      breadcrumbItems={breadcrumbItems}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Roles</CardTitle>
          <CardDescription>
            This page reads the SSO roles table and uses the configured hierarchy order as a guide.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Guard</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(roles || []).length > 0 ? roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.guard_name}</TableCell>
                    <TableCell>{role.users_count}</TableCell>
                    <TableCell>{role.permissions_count}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{role.priority || 0}</Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No roles found.
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

export default Roles
