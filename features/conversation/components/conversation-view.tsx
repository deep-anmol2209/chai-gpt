"use client";
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from "@ai-sdk/react"
import React, { useMemo, useState, useEffect } from 'react'
import { useConversations } from '../hooks/use-conversation';
import { queryKeys } from '../utils/query-keys';
import { toast } from 'sonner';
import { ChatEmpty } from './chat-empty';
import { ChatMessages } from './chat-messages';
import { ChatComposer } from './chat-composer';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createConversationAndFirstMessage } from '../actions/conversation-actions';

type ConversationViewProps = {
    conversationId: string;
    initialMessages: UIMessage[];
};

/**
 * Main chat view — header, message list (or empty state), and composer with streaming.
 */
export const ConversationView = ({ conversationId, initialMessages }: ConversationViewProps) => {

    const queryClient = useQueryClient();
    const { data: conversations } = useConversations();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [localModel, setLocalModel] = useState("gemini-3.5-flash");
    const [isCreating, setIsCreating] = useState(false);

    const transport = useMemo(() => new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
            body: {
                id, message: messages.at(-1)
            }
        })
    }), []);

    const { messages, sendMessage, status, error, regenerate, clearError } = useChat({
        id: conversationId,
        messages: initialMessages,
        transport,
        onFinish: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all,
            });
        },
        onError: (error) => {
            let displayMessage = error.message;
            try {
                const parsed = JSON.parse(error.message);
                if (parsed.message) {
                    displayMessage = parsed.message;
                }
            } catch {}
            toast.error(displayMessage || "An unexpected error occurred.");
        },
    });

    useEffect(() => {
        if (conversationId !== "new" && searchParams.get("init") === "true") {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("init");
            const cleanUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
            window.history.replaceState(null, "", cleanUrl);

            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all,
            });

            void regenerate();
        }
    }, [conversationId, searchParams, pathname, regenerate, queryClient]);

    const conversation = conversations?.find((item) => item.id === conversationId);
    const title = conversationId === "new" ? "New Chat" : (conversation?.title ?? "Chat");
    const currentModel = conversationId === "new" ? localModel : (conversation?.model ?? "gemini-3.5-flash");

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mx-1 h-4" />
                <h1 className="truncate text-sm font-medium">{title}</h1>
            </header>

            {messages.length === 0 ? (
                <ChatEmpty />
            ) : (
                <ChatMessages 
                    conversationId={conversationId}
                    messages={messages} 
                    status={status} 
                    error={error}
                    onRegenerate={regenerate}
                    onClearError={clearError}
                />
            )}

            <ChatComposer
                conversationId={conversationId}
                currentModel={currentModel}
                onModelChange={setLocalModel}
                onSend={async (text) => {
                    if (conversationId === "new") {
                        try {
                            setIsCreating(true);
                            const newId = await createConversationAndFirstMessage(text, localModel);
                            router.replace(`/c/${newId}?init=true`);
                        } catch (err: any) {
                            toast.error(err.message || "Failed to start chat.");
                            setIsCreating(false);
                        }
                    } else {
                        void sendMessage({ text });
                    }
                }}
                isSending={status !== "ready" || isCreating}
                autoFocus
            />
        </div>
    )
}