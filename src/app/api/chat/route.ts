// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';
import { authOptions } from '@/lib/auth';

// You must add SUPABASE_SERVICE_ROLE_KEY to your .env.local file
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const AI_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";

// 👇 NEW GET FUNCTION TO FETCH CHAT HISTORY
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const paperLink = searchParams.get('paperLink');

    if (!paperLink) {
        return NextResponse.json({ error: 'Paper link is required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('chat_messages')
            .select('role, content')
            .eq('user_id', userId)
            .eq('paper_id', paperLink)
            .order('created_at', { ascending: true });

        if (error) throw error;
        
        return NextResponse.json(data);

    } catch (error: unknown) {
        console.error('Error fetching chat history:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}


export async function POST(req: Request) {
  if (!TOGETHER_API_KEY) {
      return NextResponse.json({ error: 'API key is not configured.' }, { status: 500 });
  }

  try {
    // ⭐️ PASS authOptions to getServerSession
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    const { paper, userMessage } = await req.json();

    if (!paper || !userMessage) {
      return NextResponse.json({ error: 'Paper details and user message are required.' }, { status: 400 });
    }

    // ⭐️ STEP 1: Insert the paper into the 'papers' table if it doesn't exist.
    const { error: paperError } = await supabaseAdmin.from('papers').upsert({
        id: paper.link,
        title: paper.title,
        summary: paper.summary,
        authors: paper.authors,
    });
    if (paperError) throw paperError;


    // ⭐️ STEP 2: Save the user's message to the database.
    const { error: userMessageError } = await supabaseAdmin.from('chat_messages').insert({
        user_id: userId,
        paper_id: paper.link,
        role: 'user',
        content: userMessage,
    });
    if (userMessageError) throw userMessageError;


    // ⭐️ STEP 3: Call the AI model to get a response.
    // 👇 FIX: Apply the required instruction format for the Mixtral model
    const prompt = `[INST] Based on the following paper, answer the user's question.\n\nTitle: ${paper.title}\nAbstract: ${paper.summary}\n\nQuestion: ${userMessage} [/INST]`;
    
    const aiResponse = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: 'POST',
      headers: { "Authorization": `Bearer ${TOGETHER_API_KEY}`, "Content-Type": "application/json" },
      // 👇 FIX: Send the formatted prompt in a single user message
      body: JSON.stringify({ model: AI_MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 800 })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API request failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content;
    if (!aiContent) throw new Error("Invalid response from AI model.");


    // ⭐️ STEP 4: Save the AI's response to the database.
    const { error: botMessageError } = await supabaseAdmin.from('chat_messages').insert({
        user_id: userId,
        paper_id: paper.link,
        role: 'bot',
        content: aiContent,
    });
    if (botMessageError) throw botMessageError;


    // ⭐️ STEP 5: Return the AI's content to the client for display.
    return NextResponse.json({ response: aiContent });

  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}