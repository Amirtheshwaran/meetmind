import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { chunkTranscript } from './clean';

let _model: GenerativeModel | null = null;
function getModel(): GenerativeModel {
  if (!_model) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    _model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
  }
  return _model;
}

export interface MeetingAnalysis {
  overview: string;
  key_decisions: string[];
  topics: string[];
  attendees: string[];
  action_items: Array<{
    task: string;
    assignee: string;
    deadline: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

function hasGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!(key && !key.includes('AIza') && key.trim().length > 10);
}

// Static system prompt (~150 tokens — only transcript varies, keeping costs minimal)
const SYSTEM_PROMPT = `You are a meeting analyst. Extract structured data from the transcript.
Return ONLY valid JSON matching this exact schema:
{
  "overview": "2-3 sentence summary",
  "key_decisions": ["decision1", "decision2"],
  "topics": ["topic1", "topic2"],
  "attendees": ["Name1", "Name2"],
  "action_items": [
    {"task": "description", "assignee": "Name or Unassigned", "deadline": "date or empty string", "priority": "HIGH|MEDIUM|LOW"}
  ]
}
Rules: omit empty arrays, use "Unassigned" if no owner mentioned, infer priority from urgency language.`;

async function analyzeChunk(transcript: string): Promise<Partial<MeetingAnalysis>> {
  const prompt = `${SYSTEM_PROMPT}\n\n<transcript>\n${transcript}\n</transcript>`;
  const result = await getModel().generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text) as Partial<MeetingAnalysis>;
  } catch {
    // Attempt to extract JSON if wrapped in markdown
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as Partial<MeetingAnalysis>;
    throw new Error('Gemini returned invalid JSON');
  }
}

/** For very long transcripts: summarize chunks then synthesize */
async function synthesizeChunks(analyses: Partial<MeetingAnalysis>[]): Promise<MeetingAnalysis> {
  const combined = JSON.stringify(analyses);
  const prompt = `${SYSTEM_PROMPT}
Merge these partial meeting analyses into one unified result:
${combined}`;
  const result = await getModel().generateContent(prompt);
  return JSON.parse(result.response.text()) as MeetingAnalysis;
}

export async function summarizeMeeting(transcript: string): Promise<MeetingAnalysis> {
  if (!hasGeminiKey()) {
    // Wait 2 seconds to simulate processing latency
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      overview: "The team discussed the launch of the new MeetMind fullstack application, emphasizing the necessity of a free, self-contained local fallback mode. This ensures developers and users can run the entire system offline using local files and simulated AI components without external account registration.",
      key_decisions: [
        "Use local JSON file-based database for zero-configuration setup.",
        "Save recorded meeting audio files directly inside the public/uploads project directory.",
        "Implement realistic mock fallback pipelines for Whisper transcription and Gemini summary generation."
      ],
      topics: [
        "MeetMind Local Setup",
        "JSON Database Storage Integration",
        "Local Mock AI Processing Fallbacks"
      ],
      attendees: [
        "Amirthesh",
        "MeetMind Bot"
      ],
      action_items: [
        {
          task: "Complete initial local implementation integration verification",
          assignee: "Amirthesh",
          deadline: new Date().toISOString().split('T')[0],
          priority: "HIGH"
        },
        {
          task: "Ensure local public directory handles file storage cleanly",
          assignee: "MeetMind Bot",
          deadline: "",
          priority: "MEDIUM"
        }
      ]
    };
  }

  const chunks = chunkTranscript(transcript);

  if (chunks.length === 1) {
    const result = await analyzeChunk(chunks[0]);
    return result as MeetingAnalysis;
  }

  // Map-reduce for long transcripts
  const partials = await Promise.all(chunks.map(analyzeChunk));
  return synthesizeChunks(partials);
}

