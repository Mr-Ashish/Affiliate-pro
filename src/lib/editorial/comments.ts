import { prisma } from "@/lib/db";

export async function listApprovedComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId, status: "approved", parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      replies: {
        where: { status: "approved" },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
