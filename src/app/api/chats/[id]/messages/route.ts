// src/app/api/chats/[id]/messages/route.ts (Updated)
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { ArxivService } from '@/lib/arxiv-service'
import { AIService } from '@/lib/ai-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Verify user owns this chat and get chat info
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (chatError || !chat) {
      return Response.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Get conversation history
    const { data: previousMessages } = await supabase
      .from('messages')
      .select('content, role, created_at')
      .eq('chat_id', id)
      .order('created_at', { ascending: true })
      .limit(10) // Last 10 messages for context

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

    // Generate enhanced AI response
    let aiResponse: string

    if (paper_context) {
      try {
        // Fetch fresh paper data if needed
        const arxivService = new ArxivService()
        const paperData = await arxivService.getPaperById(chat.paper_arxiv_id)
        
        if (paperData) {
          const aiService = new AIService()
          const response = await aiService.generateResponse(content.trim(), {
            paper: paperData,
            conversationHistory: previousMessages?.map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: msg.created_at
            })) || []
          })
          
          aiResponse = response.content
        } else {
          aiResponse = generateFallbackResponse(content, paper_context)
        }
      } catch (error) {
        console.error('Error generating AI response:', error)
        aiResponse = generateFallbackResponse(content, paper_context)
      }
    } else {
      aiResponse = "I don't have access to the paper content right now. Please try refreshing the page."
    }

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

// Fallback response for when AI service fails
function generateFallbackResponse(userMessage: string, paperContext: any): string {
  const message = userMessage.toLowerCase()
  
  if (message.includes('summary') || message.includes('summarize')) {
    return `## Paper Summary\n\n**Title:** ${paperContext.title}\n\n**Authors:** ${paperContext.authors.join(', ')}\n\n**Abstract:** ${paperContext.abstract}\n\nThis gives you an overview of the paper's main focus and contributions. What specific aspect would you like to explore further?`
  }
  
  if (message.includes('methodology') || message.includes('method')) {
    return `## About the Methodology\n\nBased on the abstract, this paper discusses various methodological approaches. The full methodology would be detailed in the paper's Methods section.\n\n**From the abstract:** "${paperContext.abstract.substring(0, 200)}..."\n\nFor detailed methodological information, I'd recommend reviewing the full paper. What specific methodological aspect interests you?`
  }
  
  if (message.includes('contribution') || message.includes('novel')) {
    return `## Main Contributions\n\nThis research contributes to the field through:\n\n• Novel approaches described in the abstract\n• Methodological advances\n• Empirical findings and analysis\n\n**Key insight from abstract:** "${paperContext.abstract.substring(100, 300)}..."\n\nWould you like me to elaborate on any specific contribution?`
  }
  
  return `Thank you for your question about "${paperContext.title}". \n\nBased on the paper's abstract: "${paperContext.abstract.substring(0, 200)}..."\n\nThis research appears to focus on important aspects of ${paperContext.title.split(' ').slice(0, 5).join(' ')}. \n\nWhat specific aspect of this work interests you most? I can help explain different parts of the research based on the available information.`
}
