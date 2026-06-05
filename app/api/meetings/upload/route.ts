import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');
    const storagePath = searchParams.get('storagePath');

    if (!meetingId || !storagePath) {
      return NextResponse.json({ error: 'Missing meetingId or storagePath' }, { status: 400 });
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to public/uploads/meetingId/filename.webm
    const targetFilePath = path.join(process.cwd(), 'public', 'uploads', storagePath);
    const targetDir = path.dirname(targetFilePath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetFilePath, buffer);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
