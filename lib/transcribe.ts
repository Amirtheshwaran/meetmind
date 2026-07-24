import Groq from 'groq-sdk';
import { supabaseAdmin } from './supabase';
import { isLocalMode } from './db';
import fs from 'fs';
import path from 'path';

let _groq: Groq | null = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'meeting-audio';

function hasGroqKey(): boolean {
  const key = process.env.GROQ_API_KEY;
  return !!(key && !key.includes('gsk_') && key.trim().length > 10);
}

export async function transcribeAudio(storagePath: string): Promise<string> {
  let buffer: Buffer;

  if (isLocalMode()) {
    const localPath = path.join(process.cwd(), 'public', 'uploads', storagePath);
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local audio file not found at ${localPath}`);
    }
    buffer = fs.readFileSync(localPath);
  } else {
    // Download audio from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(storagePath);

    if (error || !data) {
      throw new Error(`Failed to download audio: ${error?.message}`);
    }
    buffer = Buffer.from(await data.arrayBuffer());
  }

  // If we don't have a valid Groq API key, return a mock transcript
  if (!hasGroqKey()) {
    // Wait 2 seconds to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return `[00:00] Amirthesh: Welcome everyone to today's product sync. Let's discuss the launch of MeetMind.
[00:15] Sarah: Great to be here! The core recording and audio processing engine is performing really well.
[00:34] Amirthesh: Excellent. We need to make sure the app supports full local offline execution with zero configuration.
[00:50] Speaker 1: Absolutely. I have configured the local JSON storage fallback and speaker diarization UI.
[01:12] Sarah: I will take the action item to finalize the documentation and review deployment settings for Vercel.
[01:30] Amirthesh: Sounds like a solid plan. Thanks everyone!`;
  }

  // Groq expects a File-like object — create one from the buffer
  const audioFile = new File([new Uint8Array(buffer)], 'audio.webm', { type: 'audio/webm' });

  // Send to Groq Whisper (whisper-large-v3 — free tier)
  const transcription = await getGroq().audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-large-v3',
    response_format: 'text',
    language: 'en',
  });

  return typeof transcription === 'string' ? transcription : (transcription as { text: string }).text;
}

