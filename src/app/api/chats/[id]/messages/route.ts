// src/app/api/chats/[id]/messages/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id } = await params
    
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, paper_context } = await request.json()

    if (!content?.trim()) {
      return Response.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Verify user owns this chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (chatError || !chat) {
      return Response.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Save user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from('messages')
      .insert({
        content: content.trim(),
        role: 'user',
        chat_id: id
      })
      .select()
      .single()

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError)
      return Response.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Generate AI response (simple for now)
    const aiResponse = generateAIResponse(content, paper_context)

    // Save assistant message
    const { data: assistantMessage, error: assistantMessageError } = await supabase
      .from('messages')
      .insert({
        content: aiResponse,
        role: 'assistant',
        chat_id: id
      })
      .select()
      .single()

    if (assistantMessageError) {
      console.error('Error saving assistant message:', assistantMessageError)
      return Response.json({ error: 'Failed to save AI response' }, { status: 500 })
    }

    // Update chat timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    return Response.json({
      userMessage,
      assistantMessage
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Simple AI response generator (we'll enhance this later)
function generateAIResponse(userMessage: string, paperContext: any): string {
  const message = userMessage.toLowerCase()
  
  if (!paperContext) {
    return "I don't have access to the paper content right now. Please try refreshing the page."
  }

  if (message.includes('main contribution') || message.includes('contribution')) {
    return `Based on the paper "${paperContext.title}", I can help you understand the main contributions. The abstract mentions: "${paperContext.abstract.substring(0, 200)}..." Would you like me to elaborate on any specific aspect?`
  }
  
  if (message.includes('methodology') || message.includes('method')) {
    return `Regarding the methodology in "${paperContext.title}", I can see from the abstract that the authors focused on specific approaches. The paper abstract provides: "${paperContext.abstract.substring(0, 200)}..." What specific methodological aspect would you like to discuss?`
  }
  
  if (message.includes('authors') || message.includes('who wrote')) {
    return `This paper was written by: ${paperContext.authors.join(', ')}. These researchers collaborated on "${paperContext.title}". Would you like to know more about their work or the paper's content?`
  }
  
  if (message.includes('summary') || message.includes('summarize')) {
    return `Here's a summary based on the abstract: "${paperContext.abstract}". This gives you an overview of the paper's scope and findings. What specific aspect would you like me to explain further?`
  }
  
  // Default response
  return `Thank you for your question about "${paperContext.title}". While I can provide information based on the paper's metadata and abstract, for detailed technical discussions, I'd recommend reviewing the full paper. The abstract states: "${paperContext.abstract.substring(0, 150)}..." What specific aspect interests you most?`
}
