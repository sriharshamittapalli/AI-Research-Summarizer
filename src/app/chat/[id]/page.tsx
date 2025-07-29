// src/app/chat/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from './chat-interface'

interface ChatPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  // Await params in Next.js 15
  const { id } = await params
  
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/signin')
  }

  // Fetch chat data
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns this chat
    .single()

  if (chatError || !chat) {
    redirect('/dashboard')
  }

  // Fetch existing messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chat.id)
    .order('created_at', { ascending: true })

  return (
    <ChatInterface 
      chat={chat} 
      initialMessages={messages || []} 
      user={user}
    />
  )
}
