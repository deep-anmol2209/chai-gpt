"use server";

import { prisma } from "@/lib/db"
import { requireUser } from "../../auth/actions/requireUser";
import { Conversation, CreateConversation, UpdateConversation } from "@/types/conversation";
import { revalidatePath } from "next/cache";


async function assertConversationOwner(conversationId: string, userId: string) {
    const conversation= await prisma.conversation.findFirst({
        where:{
            id: conversationId,
            userId: userId
            }})

            if(!conversation){
                throw new Error("Conversation not found")
            }
            return conversation
}

export async function createConversation(data: CreateConversation) {
    const user = await requireUser();

    return prisma.conversation.create({
        data: {
            userId: user.id,
            title: data.title?.trim() || "New Chat",
        },
    });
}

export async function updateConversation(conversationId: string, data: UpdateConversation){
    const user= await requireUser();
    await assertConversationOwner(conversationId, user.id );

    const updatedConversation = await prisma.conversation.update({
        where:{
            id: conversationId
        },
        data: {
            ...(data.title !== undefined ? { title: data.title.trim() || "New Chat" } : {}),
            ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
            ...(data.isArchived !== undefined ? { isArchived: data.isArchived } : {}),
            ...(data.model !== undefined ? { model: data.model } : {}),
            ...(data.systemPrompt !== undefined ? { systemPrompt: data.systemPrompt } : {}),
        },
    });
    revalidatePath("/");
    revalidatePath(`/c/${conversationId}`);
    return updatedConversation;
}
    

export async function deleteConversation(conversationId: string){
    const user= await requireUser();
    const conversation= await assertConversationOwner(conversationId, user.id );

    await prisma.conversation.delete({
        where:{
            id: conversationId
        },
    });
revalidatePath("/");
    revalidatePath(`/c/${conversationId}`);
    return conversation;
}

export async function listConversations() {
    const user = await requireUser();
    return prisma.conversation.findMany({
        where: { userId: user.id },
        orderBy: { lastMessageAt: "desc" },
    });
}

export async function getConversation(conversationId: string) {
    const user = await requireUser();
    const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: user.id },
    });

    if (!conversation) {
        throw new Error("Conversation not found");
    }
    return conversation;
}