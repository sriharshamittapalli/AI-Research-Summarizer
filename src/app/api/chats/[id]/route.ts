// src/app/api/chats/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function DELETE(
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

    // Delete chat (messages will be deleted due to CASCADE)
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the chat

    if (error) {
      console.error('Error deleting chat:', error)
      return Response.json({ error: 'Failed to delete chat' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Delete chat API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}