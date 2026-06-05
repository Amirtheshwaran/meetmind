import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createMeeting, updateMeetingStatus, isLocalMode } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'meeting-audio';

export async function POST(req: NextRequest) {
  try {
    const { title, contentType = 'audio/webm' } = await req.json();

    // Create meeting record
    const meeting = await createMeeting(title || 'Untitled Meeting');

    // Generate unique storage path
    const storagePath = `${meeting.id}/${uuidv4()}.webm`;

    if (isLocalMode()) {
      // Return local Next.js upload API endpoint as uploadUrl
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const uploadUrl = `${baseUrl}/api/meetings/upload?meetingId=${meeting.id}&storagePath=${storagePath}`;

      await updateMeetingStatus(meeting.id, 'UPLOADING', { storage_path: storagePath });

      return NextResponse.json({
        meetingId: meeting.id,
        uploadUrl,
        storagePath,
        token: 'local-token',
      });
    }

    // Create signed upload URL (valid for 10 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message}`);
    }

    // Update meeting with storage path and UPLOADING status
    await updateMeetingStatus(meeting.id, 'UPLOADING', { storage_path: storagePath });

    return NextResponse.json({
      meetingId: meeting.id,
      uploadUrl: data.signedUrl,
      storagePath,
      token: data.token,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

