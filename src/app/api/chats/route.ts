// src/app/api/chats/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paper_arxiv_id, paper_title } = await request.json()

    if (!paper_arxiv_id || !paper_title) {
      return Response.json(
        { error: 'paper_arxiv_id and paper_title are required' },
        { status: 400 }
      )
    }

    // Create new chat
    const { data: chat, error } = await supabase
      .from('chats')
      .insert({
        title: `Chat: ${paper_title.substring(0, 50)}${paper_title.length > 50 ? '...' : ''}`,
        user_id: user.id,
        paper_arxiv_id,
        paper_title
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Failed to create chat' }, { status: 500 })
    }

    return Response.json({ chat })
  } catch (error) {
    console.error('Chat creation error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's chats
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Failed to fetch chats' }, { status: 500 })
    }

    return Response.json({ chats })
  } catch (error) {
    console.error('Chats fetch error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}