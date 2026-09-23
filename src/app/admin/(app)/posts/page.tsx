import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { listPosts } from "@/lib/editorial/posts";
import { statusBadgeTone } from "@/lib/ui/view-models";

function formatPublishedAt(value: Date | null): string {
  if (!value) return "—";
  return value.toISOString().slice(0, 10);
}

export default async function AdminPostsPage() {
  const posts = await listPosts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Posts</h1>
          <p className="text-sm text-on-surface-variant">
            Editorial blog posts.
          </p>
        </div>
        <Link href="/admin/posts/new">
          <Button variant="primary" size="sm">
            <Icon icon={Plus} size={16} />
            New post
          </Button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No posts yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>
                  <code className="text-xs">{post.slug}</code>
                </TableCell>
                <TableCell>
                  <Badge
                    tone={
                      post.status === "published"
                        ? "active"
                        : statusBadgeTone(post.status)
                    }
                  >
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatPublishedAt(post.publishedAt)}</TableCell>
                <TableCell>{post.isFeatured ? "yes" : "no"}</TableCell>
                <TableCell>
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="font-medium text-primary hover:underline"
                  >
                    Edit
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
