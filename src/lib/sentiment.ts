/**
 * Client-side sentiment analysis for blog comments.
 * Uses a keyword-based approach with scoring to classify sentiment.
 * In production, replace this with an API call to a proper NLP service.
 */

export type SentimentResult = {
  score: number;        // -1 to 1
  label: 'positive' | 'neutral' | 'negative' | 'toxic';
  confidence: number;   // 0 to 1
  flagged: boolean;     // true if toxic or highly negative
  reason?: string;      // explanation if flagged
};

// Weighted word lists
const POSITIVE_WORDS = new Map<string, number>([
  ['great', 1], ['awesome', 1.2], ['amazing', 1.2], ['excellent', 1.3],
  ['good', 0.8], ['love', 1.2], ['wonderful', 1.3], ['fantastic', 1.3],
  ['helpful', 1], ['useful', 0.9], ['brilliant', 1.2], ['perfect', 1.3],
  ['nice', 0.7], ['best', 1.1], ['thanks', 0.8], ['thank', 0.8],
  ['appreciate', 1], ['insightful', 1.1], ['well', 0.6], ['clear', 0.8],
  ['beautiful', 1], ['elegant', 1], ['informative', 1], ['impressive', 1.1],
  ['enjoy', 0.9], ['recommend', 1], ['superb', 1.3], ['outstanding', 1.3],
  ['learned', 0.8], ['inspiring', 1.1], ['creative', 0.9], ['practical', 0.8],
  ['valuable', 1], ['concise', 0.8], ['detailed', 0.7], ['comprehensive', 0.9],
  ['agree', 0.6], ['excited', 1], ['fun', 0.8], ['cool', 0.7],
]);

const NEGATIVE_WORDS = new Map<string, number>([
  ['bad', -0.8], ['terrible', -1.2], ['awful', -1.2], ['horrible', -1.3],
  ['poor', -0.8], ['hate', -1.3], ['ugly', -1], ['boring', -0.9],
  ['useless', -1.1], ['waste', -1], ['wrong', -0.8], ['worst', -1.3],
  ['disappointing', -1], ['confused', -0.7], ['confusing', -0.8],
  ['difficult', -0.5], ['hard', -0.3], ['complex', -0.2], ['broken', -0.9],
  ['error', -0.6], ['bug', -0.5], ['fail', -0.8], ['failed', -0.8],
  ['sucks', -1.2], ['annoying', -0.9], ['frustrating', -1], ['slow', -0.6],
  ['outdated', -0.7], ['incomplete', -0.7], ['misleading', -0.9],
  ['disagree', -0.4], ['unfortunately', -0.5], ['lacking', -0.7],
]);

const TOXIC_PATTERNS = [
  /\b(idiot|stupid|dumb|moron|loser|trash|garbage|shut\s*up)\b/i,
  /\b(stfu|gtfo|wtf|damn|crap)\b/i,
  /\b(kill|die|death\s*threat)\b/i,
  /\b(racist|sexist|bigot)\b/i,
  /\b(spam|scam|fake|fraud)\b/i,
];

const NEGATION_WORDS = new Set([
  'not', "n't", 'no', 'never', 'neither', 'nor', 'none', 'nothing',
  'nowhere', 'hardly', 'barely', 'scarcely', "isn't", "wasn't",
  "aren't", "weren't", "don't", "doesn't", "didn't", "won't",
  "wouldn't", "couldn't", "shouldn't",
]);

const INTENSIFIERS = new Map<string, number>([
  ['very', 1.5], ['extremely', 1.8], ['really', 1.4], ['incredibly', 1.6],
  ['absolutely', 1.7], ['totally', 1.5], ['super', 1.4], ['highly', 1.5],
  ['quite', 1.2], ['so', 1.3], ['pretty', 1.2],
]);

/**
 * Analyze the sentiment of a comment text
 */
export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, label: 'neutral', confidence: 0, flagged: false };
  }

  const cleanText = text.toLowerCase().trim();

  // Check for toxic content first
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(cleanText)) {
      return {
        score: -1,
        label: 'toxic',
        confidence: 0.95,
        flagged: true,
        reason: 'Comment contains inappropriate or toxic language.',
      };
    }
  }

  const words = cleanText.split(/\s+/);
  let totalScore = 0;
  let wordCount = 0;
  let negationActive = false;
  let intensifier = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-zA-Z']/g, '');
    if (!word) continue;

    // Check for negation
    if (NEGATION_WORDS.has(word) || word.endsWith("n't")) {
      negationActive = true;
      continue;
    }

    // Check for intensifiers
    const intensifierVal = INTENSIFIERS.get(word);
    if (intensifierVal) {
      intensifier = intensifierVal;
      continue;
    }

    // Score positive words
    const positiveScore = POSITIVE_WORDS.get(word);
    if (positiveScore !== undefined) {
      const adjustedScore = negationActive
        ? -positiveScore * 0.75 * intensifier
        : positiveScore * intensifier;
      totalScore += adjustedScore;
      wordCount++;
      negationActive = false;
      intensifier = 1;
      continue;
    }

    // Score negative words
    const negativeScore = NEGATIVE_WORDS.get(word);
    if (negativeScore !== undefined) {
      const adjustedScore = negationActive
        ? -negativeScore * 0.75 * intensifier
        : negativeScore * intensifier;
      totalScore += adjustedScore;
      wordCount++;
      negationActive = false;
      intensifier = 1;
      continue;
    }

    // Reset modifiers on regular words
    if (negationActive && i - words.findIndex((w) => NEGATION_WORDS.has(w.replace(/[^a-zA-Z']/g, ''))) > 2) {
      negationActive = false;
    }
    intensifier = 1;
  }

  // Normalize score to -1 to 1 range
  const normalizedScore = wordCount > 0
    ? Math.max(-1, Math.min(1, totalScore / (wordCount * 1.3)))
    : 0;

  // Calculate confidence
  const confidence = Math.min(1, (wordCount / Math.max(words.length, 1)) * 2);

  // Determine label
  let label: SentimentResult['label'];
  if (normalizedScore >= 0.2) {
    label = 'positive';
  } else if (normalizedScore <= -0.5) {
    label = 'negative';
  } else if (normalizedScore < -0.15) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  // Flag highly negative content
  const flagged = normalizedScore <= -0.6;
  const reason = flagged
    ? 'Comment has highly negative sentiment and may need review.'
    : undefined;

  return {
    score: Math.round(normalizedScore * 100) / 100,
    label,
    confidence: Math.round(confidence * 100) / 100,
    flagged,
    reason,
  };
}

/**
 * Get emoji indicator for sentiment
 */
export function getSentimentEmoji(label: SentimentResult['label']): string {
  switch (label) {
    case 'positive': return '😊';
    case 'neutral': return '😐';
    case 'negative': return '😟';
    case 'toxic': return '🚫';
  }
}

/**
 * Get color classes for sentiment badge
 */
export function getSentimentColor(label: SentimentResult['label']): string {
  switch (label) {
    case 'positive':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'neutral':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    case 'negative':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    case 'toxic':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  }
}
