import Link from "next/link";
import { createPostAction } from "@/app/admin/actions";
import { listMerchants } from "@/lib/catalog/merchants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export default async function AdminNewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const merchants = await listMerchants();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="mb-2 text-sm">
          <Link
            href="/admin/posts"
            className="font-medium text-primary hover:underline"
          >
            ← Posts
          </Link>
        </p>
        <h1 className="text-2xl font-bold text-on-surface">New post</h1>
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
        <form action={createPostAction} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input id="title" name="title" type="text" required />
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
            <label htmlFor="excerpt" className="text-sm font-medium">
              Excerpt
            </label>
            <Input id="excerpt" name="excerpt" type="text" required />
          </div>
          <div className="space-y-1">
            <label htmlFor="body" className="text-sm font-medium">
              Body (Markdown)
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={12}
              className="w-full rounded-md border border-outline-variant bg-surface-lowest px-3 py-2 text-sm text-on-surface focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <p className="text-xs text-on-surface-variant">
              HTML/WYSIWYG will be supported later; this field stays the same.
            </p>
          </div>
          <div className="space-y-1">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select id="status" name="status" defaultValue="draft">
              <option value="draft">draft</option>
              <option value="published">published</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="category" className="text-sm font-medium">Category</label>
            <Input id="category" name="category" type="text" placeholder="Shopping Guides" />
          </div>
          <div className="flex items-center gap-2">
            <input id="isFeatured" name="isFeatured" type="checkbox" />
            <label htmlFor="isFeatured" className="text-sm font-medium">
              Featured
            </label>
          </div>
          <div className="space-y-1">
            <label htmlFor="seoTitle" className="text-sm font-medium">
              SEO title
            </label>
            <Input id="seoTitle" name="seoTitle" type="text" />
          </div>
          <div className="space-y-1">
            <label htmlFor="seoDescription" className="text-sm font-medium">
              SEO description
            </label>
            <Input id="seoDescription" name="seoDescription" type="text" />
          </div>
          <div className="space-y-1">
            <label htmlFor="heroImageUrl" className="text-sm font-medium">
              Hero image URL
            </label>
            <Input
              id="heroImageUrl"
              name="heroImageUrl"
              type="url"
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="heroImageAlt" className="text-sm font-medium">
              Hero image alt
            </label>
            <Input id="heroImageAlt" name="heroImageAlt" type="text" />
          </div>
          <div className="space-y-1">
            <label htmlFor="merchantIds" className="text-sm font-medium">
              Merchants
            </label>
            <Select
              id="merchantIds"
              name="merchantIds"
              multiple
              className="h-32"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.market}/{m.slug})
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="primary">
            Save post
          </Button>
        </form>
      </Card>
    </div>
  );
}
