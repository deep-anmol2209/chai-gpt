"use client";

import * as React from "react";
import { Check, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_MODELS } from "@/features/ai/utils/model";
import { useUpdateConversation } from "@/features/conversation/hooks/use-conversation";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ModelSelectorProps = {
  conversationId: string;
  currentModel: string;
};

/**
 * ModelSelector — A sleek, premium dropdown selector located inside the chat composer.
 * Allows users to choose and update which AI model they want to use for the active chat.
 */
export function ModelSelector({ conversationId, currentModel }: ModelSelectorProps) {
  const updateConversation = useUpdateConversation();
  
  const activeModel = SUPPORTED_MODELS.find((m) => m.id === currentModel) || {
    id: currentModel,
    name: currentModel,
    description: "Custom model configuration",
  };

  const handleSelectModel = (modelId: string) => {
    if (modelId === currentModel) return;
    updateConversation.mutate({
      id: conversationId,
      model: modelId,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 px-3 gap-2 rounded-full border border-border/40 bg-muted/40 hover:bg-muted/80 text-xs font-semibold shadow-none transition-all duration-200",
            updateConversation.isPending && "opacity-70 pointer-events-none"
          )}
        >
          {updateConversation.isPending ? (
            <Spinner className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3.5 text-indigo-500 animate-pulse" />
          )}
          <span className="truncate max-w-[120px]">{activeModel.name}</span>
          <ChevronDown className="size-3 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] p-1.5 rounded-2xl shadow-lg border border-border/50 backdrop-blur-md">
        {SUPPORTED_MODELS.map((model) => {
          const isSelected = model.id === currentModel;
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleSelectModel(model.id)}
              className={cn(
                "flex items-start gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition-colors duration-150",
                isSelected ? "bg-muted/65 font-medium text-foreground" : "hover:bg-muted/30"
              )}
            >
              <div className="flex h-5 items-center shrink-0">
                {isSelected ? (
                  <Check className="size-3.5 text-indigo-500 stroke-[3]" />
                ) : (
                  <div className="size-3.5" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className={cn("font-medium", isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-foreground")}>
                  {model.name}
                </span>
                <span className="text-[10px] text-muted-foreground leading-relaxed truncate">
                  {model.description}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
