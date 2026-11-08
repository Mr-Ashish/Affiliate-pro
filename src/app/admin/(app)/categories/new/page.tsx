import Link from "next/link";
import { createCategoryAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const error = (await searchParams).error;
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="mb-2 text-sm">
          <Link href="/admin/categories" className="font-medium text-primary hover:underline">← Categories</Link>
        </p>
        <h1 className="text-2xl font-bold text-on-surface">New category</h1>
      </div>
      {error ? <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-sm text-error">Error: {error}</p> : null}
      <Card className="p-6">
        <form action={createCategoryAction} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1">
            <label htmlFor="slug" className="text-sm font-medium">Slug</label>
            <Input id="slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" title="lowercase letters, numbers, hyphens" />
          </div>
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Input id="description" name="description" />
          </div>
          <div className="space-y-1">
            <label htmlFor="sortOrder" className="text-sm font-medium">Sort order</label>
            <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="isActive" type="checkbox" value="on" defaultChecked /> Active
          </label>
          <Button type="submit" variant="primary">Create category</Button>
        </form>
      </Card>
    </div>
  );
}
