import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data, error } = await supabaseAdmin
      .from('meeting_summaries')
      .select('share_token')
      .eq('meeting_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${data.share_token}`;
    return NextResponse.json({ shareToken: data.share_token, shareUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
