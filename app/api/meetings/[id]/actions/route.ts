import { NextRequest, NextResponse } from 'next/server';
import { toggleActionItem } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // meeting id not needed for action item toggle
  try {
    const { actionId, completed } = await req.json();
    await toggleActionItem(actionId, completed);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
