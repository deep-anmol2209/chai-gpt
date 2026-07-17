import { loadChatMessages, saveChatMessages } from "@/features/ai/actions/chat-store";
import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/actions/requireUser";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { convertToModelMessages, createIdGenerator, createUIMessageStreamResponse, streamText, toUIMessageStream, type UIMessage } from "ai";
import { mapServerError, APIKeyMissingError, ConversationNotFoundError } from "@/lib/errors";

/**
 * POST /api/chat — Streams an AI assistant reply for a conversation.
 *
 * Validates auth and ownership, persists the user message, then streams the
 * assistant response via the AI SDK. Final messages are saved when the stream ends.
 */
export async function POST(req: Request) {
    try {
        await auth.protect();

        // Fail-fast if the Google API key is missing
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            throw new APIKeyMissingError();
        }

        const { message, id }: { message: UIMessage, id: string } = await req.json();

        if (!message || !id) {
            return Response.json(
                { error: { message: "Missing message or conversation id", code: "BAD_REQUEST", status: 400 } },
                { status: 400 }
            );
        }

        const user = await requireUser();

        const conversation = await prisma.conversation.findFirst({
            where: {
                id,
                userId: user.id
            }
        });

        if (!conversation) {
            throw new ConversationNotFoundError();
        }

        const previousMessages = await loadChatMessages(id);

        const alreadySaved = previousMessages.some(
            (storedMessage)=>storedMessage.id === message.id
        )

        const messages = alreadySaved ? previousMessages : [...previousMessages, message];

        if(!alreadySaved){
            await saveChatMessages(id, [message]);
        }

        const result = streamText({
            model: getChatModel(conversation.model),
            system: conversation.systemPrompt ?? "You are ChaiGpt , a helpful assistant",
            messages: await convertToModelMessages(messages),
        });

        result.consumeStream();

        return createUIMessageStreamResponse({
            stream: toUIMessageStream({
               stream: result.stream,
               originalMessages: messages,
               generateMessageId: createIdGenerator({prefix:"msg" , size:16}),
               onError: (error: any) => {
                   const mapped = mapServerError(error);
                   return JSON.stringify(mapped);
               },
               onEnd: async({messages:finalMessages})=>{
                try {
                    await saveChatMessages(id , finalMessages , {updateTitle:false})
                } catch (error) {
                    console.error(error);
                }
               }
            })
        });
    } catch (error: any) {
        const mapped = mapServerError(error);
        return Response.json({ error: mapped }, { status: mapped.status });
    }
}