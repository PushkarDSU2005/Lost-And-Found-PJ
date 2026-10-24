/**
 * lib/matching.ts
 * ===============
 * Pure scoring logic for match_items() — mirrors the SQL function.
 * Used for unit tests and client-side preview.
 */

export interface ItemForMatching {
  id: string
  report_type: 'lost' | 'found'
  category: string
  location_id: string | null
  date_occurred: string | null
  title: string
}

export interface MatchCandidate extends ItemForMatching {
  score: number
}

/**
 * Compute match score between two items (mirrors SQL scoring rubric).
 * Category +3, location +2, date within 7 days +2, title similarity +3.
 * 
 * Note: title similarity here is a simple word overlap heuristic.
 * In the SQL function we use pg_trgm similarity() which is more accurate.
 */
export function computeMatchScore(
  source: ItemForMatching,
  candidate: ItemForMatching,
): number {
  let score = 0

  // Same category: +3
  if (source.category === candidate.category) score += 3

  // Same location: +2
  if (source.location_id && candidate.location_id === source.location_id) {
    score += 2
  }

  // Date within 7 days: +2
  if (source.date_occurred && candidate.date_occurred) {
    const sourceDays = new Date(source.date_occurred).getTime() / 86400000
    const candDays   = new Date(candidate.date_occurred).getTime() / 86400000
    if (Math.abs(sourceDays - candDays) <= 7) score += 2
  }

  // Title similarity (simple word overlap): +3 scaled
  const titleSim = simpleTitleSimilarity(source.title, candidate.title)
  score += Math.floor(titleSim * 3)

  return score
}

/**
 * Simple Jaccard-like word overlap coefficient (0–1).
 * Used for client-side preview — the SQL function uses pg_trgm which is better.
 */
function simpleTitleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean))
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean))
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length
  const union = new Set([...wordsA, ...wordsB]).size
  return union === 0 ? 0 : intersection / union
}

/**
 * Filter and rank candidates by score.
 * Returns top N above threshold, sorted descending.
 */
export function rankMatches(
  source: ItemForMatching,
  candidates: ItemForMatching[],
  threshold = 5,
  limit = 5,
): MatchCandidate[] {
  const scored = candidates
    .filter((c) => c.report_type !== source.report_type) // opposite type only
    .map((c) => ({ ...c, score: computeMatchScore(source, c) }))
    .filter((c) => c.score >= threshold)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit)
}
