import { NextRequest, NextResponse } from 'next/server';
import { getMeeting } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const meeting = await getMeeting(id);
    if (!meeting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ meeting });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
