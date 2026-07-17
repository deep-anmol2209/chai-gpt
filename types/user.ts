import type { Conversation } from "./conversation";

export interface User {
  id: string;
  clerkId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updateAt: Date;
  conversations?: Conversation[];
}