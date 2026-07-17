import type { Conversation } from "./conversation";
import z from "zod";

export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
export type MessageStatus = "PENDING" | "COMPLETED" | "ERROR";

export const messageRoleSchema = z.enum(["USER", "ASSISTANT", "SYSTEM", "TOOL"]);
export const messageStatusSchema = z.enum(["PENDING", "COMPLETED", "ERROR"]);

export const createMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty"),
  role: messageRoleSchema.optional(),
  status: messageStatusSchema.optional(),
});

export const updateMessageSchema = createMessageSchema.partial();

export type CreateMessage = z.infer<typeof createMessageSchema>;
export type UpdateMessage = z.infer<typeof updateMessageSchema>;

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
  updateAt: Date;
  parts?: any;
  metadata?: any;
  status: MessageStatus;
  conversationId: string;
  conversation?: Conversation;
}