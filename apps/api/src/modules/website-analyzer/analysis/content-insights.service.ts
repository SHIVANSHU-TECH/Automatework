import { load } from 'cheerio';
import type { ContentInsights } from '../types';

// ─── Stopwords ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by','from',
  'is','was','are','were','be','been','being','have','has','had','do','does','did',
  'will','would','could','should','may','might','shall','can','must','ought',
  'i','you','he','she','it','we','they','me','him','her','us','them',
  'my','your','his','its','our','their','this','that','these','those',
  'which','who','what','when','where','how','why','not','no','so','as','if',
  'then','than','just','also','more','about','up','out','into','after','before',
  'get','got','go','went','come','came','make','made','see','know','take','give',
  's','t','re','ve','ll','d','m','all','any','each','every','both','few','many',
  'some','such','own','same','other','only','even','over','under','again','further',
  'here','there','once','very','too','most','well','new','great','good','best',
  'your','our','their','its','page','site','website','home','click','read','learn',
  'https','http','www','com','net','org','html','css','js',
]);

// ─── Syllable counter (English approximation) ─────────────────────────────────

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// ─── Flesch-Kincaid reading ease ──────────────────────────────────────────────
// Score: 0–100, higher = easier to read
// 90–100: Very easy (5th grade)
// 70–90: Easy (6th grade)
// 60–70: Standard (7th–8th grade)
// 50–60: Fairly difficult (some high school)
// 30–50: Difficult (college level)
// 0–30: Very confusing (professional)

function fleschKincaidGrade(score: number): string {
  if (score >= 90) return '5th Grade (Very Easy)';
  if (score >= 70) return '6th Grade (Easy)';
  if (score >= 60) return '7th–8th Grade (Standard)';
  if (score >= 50) return 'Some High School';
  if (score >= 30) return 'College Level';
  return 'Graduate Level';
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function getContentInsights(html: string): ContentInsights {
  const $ = load(html);

  // Extract text from meaningful elements
  const paragraphs: string[] = [];
  $('p, li, h1, h2, h3, h4, h5, h6, td, blockquote').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 20) paragraphs.push(text);
  });

  const fullText = paragraphs.join(' ');

  // Word count
  const words = fullText.split(/\s+/).filter(w => w.length > 1);
  const wordCount = words.length;

  // Sentence count
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const sentenceCount = Math.max(sentences.length, 1);

  // Syllable count
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

  // Flesch-Kincaid Reading Ease formula
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 1;
  const rawScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  const readabilityScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  const readabilityGrade = fleschKincaidGrade(readabilityScore);

  // Keyword frequency
  const freq: Record<string, number> = {};
  for (const word of words) {
    const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.length >= 4 && !STOPWORDS.has(normalized)) {
      freq[normalized] = (freq[normalized] ?? 0) + 1;
    }
  }

  const topKeywords = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({
      word,
      count,
      density: wordCount > 0 ? `${((count / wordCount) * 100).toFixed(1)}%` : '0%',
    }));

  // Content depth
  let contentDepth: ContentInsights['contentDepth'];
  if (wordCount >= 800)       contentDepth = 'deep';
  else if (wordCount >= 300)  contentDepth = 'moderate';
  else                        contentDepth = 'thin';

  // Structured content check
  const hasStructuredContent = (
    $('ul li, ol li').length >= 3 ||
    $('table').length > 0 ||
    $('code, pre').length > 0 ||
    $('blockquote').length > 0
  );

  return {
    wordCount,
    readabilityScore,
    readabilityGrade,
    topKeywords,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    hasStructuredContent,
    contentDepth,
  };
}
