import Link from "next/link";
import { createMerchantAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default async function AdminNewMerchantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="mb-2 text-sm">
          <Link
            href="/admin/merchants"
            className="font-medium text-primary hover:underline"
          >
            ← Merchants
          </Link>
        </p>
        <h1 className="text-2xl font-bold text-on-surface">New merchant</h1>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-error-container px-3 py-2 text-sm text-error"
        >
          Error: {error}
        </p>
      ) : null}

      <Card className="space-y-4 p-6">
        <form action={createMerchantAction} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input id="name" name="name" type="text" required />
          </div>
          <div className="space-y-1">
            <label htmlFor="slug" className="text-sm font-medium">
              Slug
            </label>
            <Input
              id="slug"
              name="slug"
              type="text"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="lowercase letters, numbers, hyphens"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="siteUrl" className="text-sm font-medium">
              Site URL
            </label>
            <Input
              id="siteUrl"
              name="siteUrl"
              type="url"
              required
              placeholder="https://example.com"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="logoUrl" className="text-sm font-medium">Logo URL</label>
            <Input id="logoUrl" name="logoUrl" type="url" placeholder="https://…" />
          </div>
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Input id="description" name="description" type="text" />
          </div>
          <div className="space-y-1">
            <label htmlFor="defaultOfferImageUrl" className="text-sm font-medium">Default offer image</label>
            <Input id="defaultOfferImageUrl" name="defaultOfferImageUrl" type="url" placeholder="https://…" />
          </div>
          <div className="space-y-1">
            <label htmlFor="market" className="text-sm font-medium">
              Market
            </label>
            <Input id="market" name="market" type="text" defaultValue="US" />
          </div>
          <Button type="submit" variant="primary">
            Create merchant
          </Button>
        </form>
      </Card>
    </div>
  );
}
