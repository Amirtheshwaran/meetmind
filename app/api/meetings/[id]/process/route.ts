import { NextRequest } from 'next/server';
import { getMeeting, updateMeetingStatus, saveSummary, saveActionItems } from '@/lib/db';
import { transcribeAudio } from '@/lib/transcribe';
import { cleanTranscript } from '@/lib/clean';
import { summarizeMeeting } from '@/lib/summarize';

export const runtime = 'nodejs';
export const maxDuration = 300;

function sseEvent(type: string, data: Record<string, unknown>) {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { duration_sec = 0 } = await req.json().catch(() => ({}));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: Record<string, unknown> = {}) => {
        controller.enqueue(encoder.encode(sseEvent(type, data)));
      };

      try {
        // Validate meeting exists
        const meeting = await getMeeting(id);
        if (!meeting || !meeting.storage_path) {
          send('error', { message: 'Meeting or audio not found' });
          controller.close();
          return;
        }

        // Step 1: Mark as processing
        await updateMeetingStatus(id, 'PROCESSING', { duration_sec });
        send('status', { step: 'transcribing', message: 'Transcribing audio with Groq Whisper…' });

        // Step 2: Transcribe
        const rawTranscript = await transcribeAudio(meeting.storage_path);
        send('status', { step: 'cleaning', message: 'Cleaning transcript…' });

        // Step 3: Clean
        const cleanedTranscript = cleanTranscript(rawTranscript);

        // Save raw transcript to DB
        await updateMeetingStatus(id, 'PROCESSING', {
          raw_transcript: rawTranscript,
        });

        send('transcript', { transcript: cleanedTranscript.slice(0, 500) + '…' });
        send('status', { step: 'summarizing', message: 'Generating meeting summary with Gemini…' });

        // Step 4: Summarize
        const analysis = await summarizeMeeting(cleanedTranscript);
        send('status', { step: 'saving', message: 'Saving results…' });

        // Step 5: Persist
        await saveSummary(id, {
          overview: analysis.overview,
          key_decisions: analysis.key_decisions ?? [],
          topics: analysis.topics ?? [],
          attendees: analysis.attendees ?? [],
        });

        await saveActionItems(
          id,
          (analysis.action_items ?? []).map((a) => ({
            task: a.task,
            assignee: a.assignee || 'Unassigned',
            deadline: a.deadline || undefined,
            priority: a.priority ?? 'MEDIUM',
          }))
        );

        await updateMeetingStatus(id, 'DONE');

        send('done', {
          message: 'Processing complete!',
          overview: analysis.overview,
          actionItemCount: analysis.action_items?.length ?? 0,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await updateMeetingStatus(id, 'ERROR', { error_message: msg }).catch(() => {});
        send('error', { message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
