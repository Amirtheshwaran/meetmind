import { NextRequest, NextResponse } from 'next/server';
import { createMeeting, listMeetings } from '@/lib/db';

export async function GET() {
  try {
    const meetings = await listMeetings();
    return NextResponse.json({ meetings });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = body.title || 'Untitled Meeting';
    const meeting = await createMeeting(title);
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
