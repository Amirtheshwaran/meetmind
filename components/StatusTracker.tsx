'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StatusTrackerProps {
  meetingId: string;
  durationSec?: number;
}

interface Step {
  key: string;
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { key: 'transcribing', label: 'Transcribing with Groq Whisper', icon: '🎙' },
  { key: 'cleaning', label: 'Cleaning transcript', icon: '✏️' },
  { key: 'summarizing', label: 'Generating summary with Gemini', icon: '🤖' },
  { key: 'saving', label: 'Saving to database', icon: '💾' },
];

export default function StatusTracker({ meetingId, durationSec = 0 }: StatusTrackerProps) {
  const [currentStep, setCurrentStep] = useState('');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [overview, setOverview] = useState('');
  const [actionCount, setActionCount] = useState(0);
  const router = useRouter();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const es = new EventSource(`/api/meetings/${meetingId}/process`);

    // Start processing via POST, then switch to SSE
    fetch(`/api/meetings/${meetingId}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration_sec: durationSec }),
    }).catch(() => {});

    // Close the EventSource and poll instead (SSE POST workaround)
    es.close();

    // Use fetch with ReadableStream for SSE from POST
    startSSE();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  const startSSE = async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_sec: durationSec }),
      });

      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleEvent(event);
          } catch {}
        }
      }
    } catch (err) {
      setIsError(true);
      setErrorMsg(err instanceof Error ? err.message : 'Processing failed');
    }
  };

  const handleEvent = (event: Record<string, unknown>) => {
    const type = event.type as string;

    if (type === 'status') {
      const step = event.step as string;
      setCurrentStep(step);
      setCompletedSteps((prev) => {
        const stepIdx = STEPS.findIndex((s) => s.key === step);
        return STEPS.slice(0, stepIdx).map((s) => s.key);
      });
    }

    if (type === 'done') {
      setCompletedSteps(STEPS.map((s) => s.key));
      setCurrentStep('');
      setIsDone(true);
      setOverview(event.overview as string);
      setActionCount(event.actionItemCount as number);
    }

    if (type === 'error') {
      setIsError(true);
      setErrorMsg(event.message as string);
    }
  };

  const getStepState = (key: string) => {
    if (completedSteps.includes(key)) return 'done';
    if (currentStep === key) return 'active';
    return 'idle';
  };

  return (
    <div>
      <div className="progress-steps">
        {STEPS.map((step) => {
          const s = getStepState(step.key);
          return (
            <div key={step.key} className={`progress-step ${s}`}>
              <span>
                {s === 'done' ? '✓' : s === 'active' ? <span className="spin">⟳</span> : '○'}
              </span>
              <span>{step.icon} {step.label}</span>
            </div>
          );
        })}

        {isError && (
          <div className="progress-step error">
            <span>✗</span>
            <span>Error: {errorMsg}</span>
          </div>
        )}
      </div>

      {isDone && (
        <div className="mt-6" style={{ textAlign: 'center' }}>
          <div
            style={{
              background: 'var(--green-bg)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <p className="font-semibold" style={{ color: 'var(--green)', marginBottom: 4 }}>
              ✓ Processing complete!
            </p>
            <p className="text-sm text-secondary">{actionCount} action items extracted</p>
          </div>
          <button
            className="btn btn-primary btn-lg w-full"
            onClick={() => router.push(`/meetings/${meetingId}`)}
          >
            View Meeting Summary →
          </button>
        </div>
      )}
    </div>
  );
}
