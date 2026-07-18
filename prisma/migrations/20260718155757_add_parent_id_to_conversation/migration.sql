-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
