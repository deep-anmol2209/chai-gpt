import { ConversationView } from '@/features/conversation/components/conversation-view'
import React from 'react'

/**
 * Home page — renders the chat UI for a new, unsaved conversation.
 */
const page = () => {
  return (
    <ConversationView
      conversationId="new"
      initialMessages={[]}
    />
  )
}

export default page