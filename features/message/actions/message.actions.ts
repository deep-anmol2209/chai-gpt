"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/actions/requireUser";
import { prisma } from "@/lib/db";
import { Message, CreateMessage, UpdateMessage } from "@/types/message";


/**
 * Verifies that a conversation exists and belongs to the given user.
 *
 * @throws {Error} When the conversation is not found.
 */
async function assertOwnsConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
    });

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    return conversation;
}

/** Load messages for a conversation (oldest → newest). */
export async function listMessages(
    conversationId: string
  ): Promise<Message[]> {
    const user = await requireUser();
    await assertOwnsConversation(conversationId, user.id);
  
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return messages as unknown as Message[];
  }
  
  /**
   * Create a user message in a conversation.
   * No AI reply yet — this only persists the user's text.
   * Optionally renames "New Chat" using the first message.
   */
  export async function createMessage(conversationId: string, data: CreateMessage) {
    const user = await requireUser();
    const conversation = await assertOwnsConversation(conversationId, user.id);
  
    const trimmed = data.content.trim();
    if (!trimmed) {
      throw new Error("Message cannot be empty");
    }
  
    const message = await prisma.message.create({
      data: {
        conversationId,
        role: data.role ?? "USER",
        status: data.status ?? "COMPLETED",
        content: trimmed,
      },
    });
  
    const shouldRename =
      conversation.title === "New Chat" || conversation.title.trim() === "";
  
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        ...(shouldRename
          ? {
              title:
                trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed,
            }
          : {}),
      },
    });
  
    revalidatePath("/");
    revalidatePath(`/c/${conversationId}`);
    return message as unknown as Message;
  }
  
  /** Update message text (e.g. edit). */
  export async function updateMessage(messageId: string, data: UpdateMessage) {
    const user = await requireUser();
    if (data.content === undefined) {
      throw new Error("Message content is required");
    }
    const trimmed = data.content.trim();
  
    if (!trimmed) {
      throw new Error("Message cannot be empty");
    }
  
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });
  
    if (!existing || existing.conversation.userId !== user.id) {
      throw new Error("Message not found");
    }
  
    const message = await prisma.message.update({
      where: { id: messageId },
      data: { content: trimmed },
    });
  
    revalidatePath(`/c/${existing.conversationId}`);
    return message as unknown as Message;
  }
  
  /** Delete a single message. */
  export async function deleteMessage(messageId: string) {
    const user = await requireUser();
  
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });
  
    if (!existing || existing.conversation.userId !== user.id) {
      throw new Error("Message not found");
    }
  
    await prisma.message.delete({ where: { id: messageId } });
  
    revalidatePath(`/c/${existing.conversationId}`);
    return { id: messageId, conversationId: existing.conversationId };
  }
  