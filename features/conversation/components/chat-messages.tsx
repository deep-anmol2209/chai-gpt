"use client";

import { type UIMessage } from "ai";
import type { ChatStatus } from "ai";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, RotateCw, X, Copy, GitBranch } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { branchConversation } from "../actions/conversation-actions";
import { queryKeys } from "../utils/query-keys";

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function parseChatError(error: Error | undefined) {
  const defaultTitle = "Generation Error";
  const defaultMessage = "Something went wrong. Please try again.";

  if (!error) return { title: defaultTitle, message: defaultMessage };

  try {
    const parsed = JSON.parse(error.message);
    if (parsed.code) {
      let title = defaultTitle;
      switch (parsed.code) {
        case "MODEL_LIMIT_EXCEEDED":
          title = "Model Limit Exceeded";
          break;
        case "API_KEY_MISSING":
        case "INVALID_API_KEY":
          title = "Configuration Issue";
          break;
        case "DATABASE_ERROR":
          title = "Database Error";
          break;
        case "CONVERSATION_NOT_FOUND":
          title = "Conversation Not Found";
          break;
        case "UNAUTHORIZED":
          title = "Unauthorized Access";
          break;
        default:
          title = "Service Error";
      }
      return {
        title,
        message: parsed.message || defaultMessage,
      };
    }
  } catch {}

  // Fallback pattern matching for raw text errors
  const messageStr = error.message || "";
  if (messageStr.includes("API key")) {
    return {
      title: "Configuration Issue",
      message: "Something went wrong in backend.",
    };
  }

  return {
    title: defaultTitle,
    message: messageStr || defaultMessage,
  };
}

type ChatMessagesProps = {
  conversationId: string;
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
  onRegenerate?: () => void;
  onClearError?: () => void;
};

/**
 * Renders the conversation message list with responses, loading indicator, and structured errors.
 */
export function ChatMessages({
  conversationId,
  messages,
  status,
  error,
  onRegenerate,
  onClearError,
}: ChatMessagesProps) {
  const [isBranching, setIsBranching] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Response copied to clipboard");
  };

  const handleBranch = async (messageId: string) => {
    try {
      setIsBranching(messageId);
      const newId = await branchConversation(conversationId, messageId);
      
      await queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });

      toast.success("Conversation branched successfully!");
      router.push(`/c/${newId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to branch conversation.");
    } finally {
      setIsBranching(null);
    }
  };

  const isWaiting =
    status === "submitted" && messages.at(-1)?.role === "user";

  const parsedError = error ? parseChatError(error) : null;

  return (
    <Conversation className="flex-1">
      <ConversationContent className="py-8 px-4 md:px-6 max-w-3xl mx-auto flex flex-col gap-8">
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              {message.role === "user" ? (
                getMessageText(message)
              ) : (
                <MessageResponse>
                  {getMessageText(message)}
                </MessageResponse>
              )}
            </MessageContent>
            {message.role === "assistant" && (
              <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pl-1 mt-1">
                <MessageAction
                  tooltip="Copy response"
                  onClick={() => handleCopy(getMessageText(message))}
                >
                  <Copy className="size-4" />
                </MessageAction>
                {conversationId !== "new" && (
                  <MessageAction
                    tooltip="Branch conversation"
                    onClick={() => handleBranch(message.id)}
                    disabled={
                      isBranching === message.id ||
                      (status !== "ready" && message.id === messages.at(-1)?.id)
                    }
                  >
                    {isBranching === message.id ? (
                      <Loader size={14} className="size-3.5" />
                    ) : (
                      <GitBranch className="size-4" />
                    )}
                  </MessageAction>
                )}
              </MessageActions>
            )}
          </Message>
        ))}

        {isWaiting ? (
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader size={16} />
                <span>Thinking...</span>
              </div>
            </MessageContent>
          </Message>
        ) : null}

        {error && parsedError ? (
          <div className="w-full flex justify-center py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Alert variant="destructive" className="max-w-2xl border-destructive/20 bg-destructive/5 backdrop-blur-sm shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <AlertTitle className="text-sm font-semibold tracking-tight text-destructive col-start-2">
                    {parsedError.title}
                  </AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground/80 leading-relaxed col-start-2">
                    {parsedError.message}
                  </AlertDescription>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 self-end sm:self-center">
                {onRegenerate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRegenerate}
                    className="group h-8 px-3 text-xs gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                  >
                    <RotateCw className="size-3.5 transition-transform duration-500 group-hover:rotate-180" />
                    Regenerate
                  </Button>
                )}
                {onClearError && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClearError}
                    className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors duration-200"
                  >
                    <X className="size-4" />
                    <span className="sr-only">Dismiss error</span>
                  </Button>
                )}
              </div>
            </Alert>
          </div>
        ) : null}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}