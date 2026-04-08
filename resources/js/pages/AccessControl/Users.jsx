import SectionShell from "./SectionShell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Access Control", href: "/access-control" },
  { label: "Users", href: "/access-control/users" },
]

const Users = ({ users }) => {
  return (
    <SectionShell
      title="User Management"
      description="Read-only user directory with direct role assignments and role priority hints."
      breadcrumbItems={breadcrumbItems}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Users</CardTitle>
          <CardDescription>
            This page reads the SSO users table and shows each user&apos;s direct roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>IPMS ID</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Primary Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users || []).length > 0 ? users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.ipms_id || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {(user.roles || []).length > 0 ? (
                          user.roles.map((role) => <Badge key={role} variant="secondary">{role}</Badge>)
                        ) : (
                          <span className="text-sm text-muted-foreground">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{user.primary_role || "-"}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users found.
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

export default Users
