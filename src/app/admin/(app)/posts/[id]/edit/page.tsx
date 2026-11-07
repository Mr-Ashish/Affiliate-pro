import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePostAction } from "@/app/admin/actions";
import { listMerchants } from "@/lib/catalog/merchants";
import { getPostById } from "@/lib/editorial/posts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export default async function AdminEditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const [{ error }, post, merchants] = await Promise.all([
    searchParams,
    getPostById(id),
    listMerchants(),
  ]);

  if (!post) {
    notFound();
  }

  const selectedMerchantIds = post.merchants.map((m) => m.id);

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
        <h1 className="text-2xl font-bold text-on-surface">Edit post</h1>
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
        <form action={updatePostAction} className="space-y-4">
          <input type="hidden" name="id" value={post.id} />
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={post.title}
            />
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
              defaultValue={post.slug}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="excerpt" className="text-sm font-medium">
              Excerpt
            </label>
            <Input
              id="excerpt"
              name="excerpt"
              type="text"
              required
              defaultValue={post.excerpt}
            />
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
              defaultValue={post.body}
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
            <Select id="status" name="status" defaultValue={post.status}>
              <option value="draft">draft</option>
              <option value="published">published</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isFeatured"
              name="isFeatured"
              type="checkbox"
              defaultChecked={post.isFeatured}
            />
            <label htmlFor="isFeatured" className="text-sm font-medium">
              Featured
            </label>
          </div>
          <div className="space-y-1">
            <label htmlFor="seoTitle" className="text-sm font-medium">
              SEO title
            </label>
            <Input
              id="seoTitle"
              name="seoTitle"
              type="text"
              defaultValue={post.seoTitle ?? ""}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="seoDescription" className="text-sm font-medium">
              SEO description
            </label>
            <Input
              id="seoDescription"
              name="seoDescription"
              type="text"
              defaultValue={post.seoDescription ?? ""}
            />
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
              defaultValue={post.hero?.url ?? ""}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="heroImageAlt" className="text-sm font-medium">
              Hero image alt
            </label>
            <Input
              id="heroImageAlt"
              name="heroImageAlt"
              type="text"
              defaultValue={post.hero?.alt ?? ""}
            />
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
              defaultValue={selectedMerchantIds}
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
