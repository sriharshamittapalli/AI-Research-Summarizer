// src/app/api/recently-viewed/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import type { Paper, DbPaper } from '@/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
        .from('user_recently_viewed')
        .select('papers(*)')
        .eq('user_id', session.user.id)
        .order('viewed_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const papersFromDb: DbPaper[] = data.flatMap(item => item.papers).filter(Boolean);

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

// POST and DELETE functions remain the same...
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const paper: Paper = await req.json();

        const { error: paperError } = await supabaseAdmin.from('papers').upsert({
            id: paper.link,
            title: paper.title,
            summary: paper.summary,
            authors: paper.authors
        });

        if (paperError) throw paperError;

        const { error: recentlyViewedError } = await supabaseAdmin.from('user_recently_viewed').upsert({
            user_id: session.user.id,
            paper_id: paper.link,
            viewed_at: new Date().toISOString()
        });

        if (recentlyViewedError) throw recentlyViewedError;

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error: unknown) {
        console.error('Error in POST /api/recently-viewed:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

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
            .from('user_recently_viewed')
            .delete()
            .match({ user_id: session.user.id, paper_id: paperLink });

        if (error) {
            console.error('Error removing from recently viewed:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e: unknown) {
        console.error('Error in DELETE /api/recently-viewed:', e);
        const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}