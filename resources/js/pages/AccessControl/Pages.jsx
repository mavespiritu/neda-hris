import SectionShell from "./SectionShell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const breadcrumbItems = [
  { label: "Home", href: "/" },
  { label: "Access Control", href: "/access-control" },
  { label: "Pages", href: "/access-control/pages" },
]

const Pages = ({ pages }) => {
  return (
    <SectionShell
      title="Page Management"
      description="A planning view for page-to-role mapping before we wire active-role enforcement."
      breadcrumbItems={breadcrumbItems}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Pages</CardTitle>
          <CardDescription>
            This is a static registry for the major app areas we want to govern through access control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Default Access</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pages || []).length > 0 ? pages.map((page) => (
                  <TableRow key={`${page.module}-${page.page}`}>
                    <TableCell className="font-medium">{page.module}</TableCell>
                    <TableCell>{page.page}</TableCell>
                    <TableCell><Badge variant="secondary">{page.route}</Badge></TableCell>
                    <TableCell>{page.default_access}</TableCell>
                    <TableCell>{page.description}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No page registry entries yet.
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

export default Pages
