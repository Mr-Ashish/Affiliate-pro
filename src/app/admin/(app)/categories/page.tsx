import Link from "next/link";
import { listCategoriesAdmin } from "@/lib/catalog/categories";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesAdmin();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Categories</h1>
          <p className="text-sm text-on-surface-variant">
            Global browse taxonomy. Assign offers from a category or from the offer page.
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button variant="primary" size="sm">New category</Button>
        </Link>
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No categories yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Offers</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Sort</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/categories/${category.id}`} className="text-primary hover:underline">
                    {category.name}
                  </Link>
                </TableCell>
                <TableCell><code className="text-xs">{category.slug}</code></TableCell>
                <TableCell className="tabular-nums">{category._count.offers}</TableCell>
                <TableCell>{category.isActive ? "yes" : "no"}</TableCell>
                <TableCell className="tabular-nums">{category.sortOrder}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
