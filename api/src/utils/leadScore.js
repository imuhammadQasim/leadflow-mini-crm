/**
 * Lead Score (0-100)
 * ------------------
 * A custom heuristic used to help the agency triage which new leads are
 * worth calling first, before any human has looked at them. It combines
 * five signals available at submission time. None of this is copied from a
 * known scoring model - the weights below are a judgment call about what
 * would matter to a small digital agency, and are meant to be tuned later
 * once real conversion data exists.
 *
 * Budget range        -> up to 40 points (biggest factor: it caps how much
 *                         revenue the lead could realistically be worth)
 * Service requested    -> up to 15 points (some services are higher-ticket /
 *                         higher-margin for the agency than others)
 * Message quality       -> up to 15 points (a longer, more specific brief
 *                         signals a lead who has actually thought it through)
 * Phone provided        -> up to 10 points (a working phone number means
 *                         the lead can be called immediately, not just emailed)
 * Source quality        -> up to 15 points (referrals and organic search
 *                         convert better in practice than paid/social clicks)
 * Business email bonus  -> up to  5 points (a non-freemail domain usually
 *                         means a company inquiry rather than a casual one)
 *
 * Weights sum to 100, so a lead that maxes out every signal scores 100.
 */

const BUDGET_SCORES = {
  under_1k: 8,
  "1k_5k": 16,
  "5k_10k": 24,
  "10k_25k": 32,
  "25k_plus": 40,
};

// Reflects rough profitability/priority order for a generalist agency -
// build/dev work and branding retainers are typically higher value than a
// one-off SEO audit or "other" catch-all requests.
const SERVICE_SCORES = {
  "Web Development": 15,
  Branding: 13,
  "Digital Marketing": 11,
  SEO: 9,
  Consulting: 7,
  Other: 4,
};

const SOURCE_SCORES = {
  referral: 15,
  organic: 12,
  website: 8,
  ads: 9,
  social: 6,
  other: 4,
};

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
]);

function scoreMessageQuality(message = "") {
  const length = message.trim().length;
  if (length >= 80) return 15; // a real, specific brief
  if (length >= 20) return 10; // a short but genuine message
  if (length > 0) return 5; // bare minimum, e.g. "call me"
  return 0;
}

function scorePhoneProvided(phone = "") {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? 10 : 0;
}

function scoreBusinessEmail(email = "") {
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain && !FREE_EMAIL_DOMAINS.has(domain)) return 5;
  return 0;
}

/**
 * @param {{budgetRange: string, service: string, message: string, phone: string, email: string, source: string}} lead
 * @returns {number} integer score clamped to 0-100
 */
function calculateLeadScore(lead) {
  const budgetPoints = BUDGET_SCORES[lead.budgetRange] ?? 0;
  const servicePoints = SERVICE_SCORES[lead.service] ?? 0;
  const messagePoints = scoreMessageQuality(lead.message);
  const phonePoints = scorePhoneProvided(lead.phone);
  const sourcePoints = SOURCE_SCORES[lead.source] ?? 0;
  const emailBonus = scoreBusinessEmail(lead.email);

  const total =
    budgetPoints +
    servicePoints +
    messagePoints +
    phonePoints +
    sourcePoints +
    emailBonus;

  return Math.max(0, Math.min(100, Math.round(total)));
}

module.exports = { calculateLeadScore };
