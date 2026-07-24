import { NextRequest, NextResponse } from 'next/server';
import { toggleActionItem, addActionItem, deleteActionItem } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  try {
    const { actionId, completed } = await req.json();
    await toggleActionItem(actionId, completed);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    if (!body.task || typeof body.task !== 'string') {
      return NextResponse.json({ error: 'Task description is required' }, { status: 400 });
    }
    const newItem = await addActionItem(id, {
      task: body.task.trim(),
      assignee: body.assignee?.trim() || 'Unassigned',
      deadline: body.deadline || undefined,
      priority: ['HIGH', 'MEDIUM', 'LOW'].includes(body.priority) ? body.priority : 'MEDIUM',
    });
    return NextResponse.json({ item: newItem });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  try {
    const { actionId } = await req.json();
    if (!actionId) {
      return NextResponse.json({ error: 'Action ID required' }, { status: 400 });
    }
    await deleteActionItem(actionId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

