// src/app/api/history/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import type { DbPaper } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';
  
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.rpc('get_chat_history_papers', {
        p_user_id: session.user.id
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const papersFromDb: DbPaper[] = data || [];

    const papersForClient = papersFromDb.map((p) => ({
      title: p.title,
      authors: p.authors,
      summary: p.summary,
      link: p.id
    }));

    return new NextResponse(JSON.stringify(papersForClient), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
    });
}

// DELETE function remains the same...
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const paperLink = searchParams.get('paperLink');

        if (!paperLink) {
            return NextResponse.json({ error: 'Paper link is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('chat_messages')
            .delete()
            .match({ user_id: session.user.id, paper_id: paperLink });

        if (error) {
            console.error('Error deleting chat history:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e: unknown) {
        console.error('Error in DELETE /api/history:', e);
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}