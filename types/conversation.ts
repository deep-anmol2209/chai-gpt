import type { User } from "./user";
import type { Message } from "./message";
import z from "zod"


export const createConversationSchema = z.object({
  title: z.string().trim().optional(),
  isArchived: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  model: z.string().optional(),
  systemPrompt: z.string().optional(),
});

export const updateConversationSchema =
  createConversationSchema.partial();

export type CreateConversation = z.infer<typeof createConversationSchema>;
export type UpdateConversation = z.infer<typeof updateConversationSchema>;


export interface Conversation {
  id: string;
  title: string;
  isArchived: boolean;
  isPinned: boolean;
  userId: string;
  user?: User;
  model: string | null;
  systemPrompt: string | null;
  createdAt: Date;
  updateAt: Date;
  lastMessageAt: Date | null;
  messages?: Message[];
}