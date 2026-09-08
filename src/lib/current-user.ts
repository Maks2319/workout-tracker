import { prisma } from "@/lib/prisma";

// Single-user app for now — always resolves to the first (and only) account.
export async function getCurrentUser() {
  return prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
}
