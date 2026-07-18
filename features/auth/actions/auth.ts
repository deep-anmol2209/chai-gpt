import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function onBoardUser(userData?: {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
}) {
  let user = userData;

  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;
    user = {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? "",
      firstName: clerkUser.firstName ?? "",
      lastName: clerkUser.lastName ?? "",
      imageUrl: clerkUser.imageUrl ?? undefined,
    };
  }

  try {
    const existingByClerk = await prisma.user.findUnique({
      where: { clerkId: user.clerkId },
    });

    if (existingByClerk) {
      return await prisma.user.update({
        where: { clerkId: user.clerkId },
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        },
      });
    }

    if (user.email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingByEmail) {
        return await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            clerkId: user.clerkId,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
          },
        });
      }
    }

    return await prisma.user.create({
      data: {
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error: any) {
    if (error && typeof error === "object" && error.code === "P2002") {
      const existing = await prisma.user.findUnique({
        where: { clerkId: user.clerkId },
      });
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
}