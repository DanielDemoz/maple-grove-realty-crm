/**
 * scoring.js, Pure lead-scoring logic (no dependencies).
 *
 * Scoring model (max 100):
 *   Timeline:  ASAP +40 | 1-3 months +25 | 3-6 months +10 | Just browsing +0
 *   Intent:    Investing +30 | Buying +20 | Selling +20
 *   Budget:    lowest tier +5 → highest tier +30 (linear across 5 tiers)
 */

/** Points awarded per budget tier index (0 = lowest, 4 = highest). */
const BUDGET_POINTS = [5, 10, 15, 20, 30];

/** Timeline urgency weights. */
const TIMELINE_POINTS = {
  'ASAP': 40,
  '1-3 months': 25,
  '3-6 months': 10,
  'Just browsing': 0
};

/** Intent type weights. */
const INTENT_POINTS = {
  'Investing': 30,
  'Buying': 20,
  'Selling': 20
};

/**
 * Calculate a numeric score (0–100) for a lead object.
 * @param {object} lead, must include timeline, intent, and budget fields
 * @returns {number}
 */
function scoreLead(lead) {
  let total = 0;

  // Timeline urgency
  total += TIMELINE_POINTS[lead.timeline] ?? 0;

  // Intent type
  total += INTENT_POINTS[lead.intent] ?? 0;

  // Budget tier, map label to index in BUDGET_TIERS (defined in data.js)
  const tierIndex = typeof BUDGET_TIERS !== 'undefined'
    ? BUDGET_TIERS.indexOf(lead.budget)
    : -1;
  if (tierIndex >= 0 && tierIndex < BUDGET_POINTS.length) {
    total += BUDGET_POINTS[tierIndex];
  }

  return Math.min(total, 100);
}

/**
 * Map a numeric score to a human-readable tier label.
 * @param {number} score
 * @returns {'Hot'|'Warm'|'Cold'}
 */
function scoreTier(score) {
  if (score >= 70) return 'Hot';
  if (score >= 40) return 'Warm';
  return 'Cold';
}
