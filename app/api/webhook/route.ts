import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { onBoardUser } from "@/features/auth/actions/auth";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const user = evt.data;

      const email = user.email_addresses.find(
        (e) => e.id === user.primary_email_address_id
      )?.email_address;

      await onBoardUser({
        clerkId: user.id,
        email: email ?? "",
        firstName: user.first_name ?? "",
        lastName: user.last_name ?? "",
        imageUrl: user.image_url ?? undefined,
      });
    } else if (evt.type === "user.deleted") {
      const user = evt.data;
      if (user.id) {
        await prisma.user.delete({
          where: { clerkId: user.id },
        });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Invalid webhook", { status: 400 });
  }
}