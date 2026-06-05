/** Strip common filler words and clean up transcript before sending to LLM */
export function cleanTranscript(raw: string): string {
  return raw
    // Remove filler words (word-boundary aware)
    .replace(/\b(um+|uh+|hmm+|mhm|you know|like|sort of|kind of|basically|literally|actually|right\?|okay so|so yeah|i mean)\b/gi, '')
    // Collapse multiple spaces
    .replace(/  +/g, ' ')
    // Collapse multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim each line
    .split('\n').map(l => l.trim()).join('\n')
    .trim();
}

/** Estimate token count (rough: 1 token ≈ 4 chars) */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Split transcript into chunks at sentence boundaries if too long */
export function chunkTranscript(text: string, maxTokens = 28000): string[] {
  if (estimateTokens(text) <= maxTokens) return [text];

  const maxChars = maxTokens * 4;
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];

  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > maxChars && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
