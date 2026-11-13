// Server-side objectionable-content filter for the anonymous Community.
// Keep in sync with frontend/src/lib/moderation.ts (the client runs the same
// check first; this one cannot be bypassed).
//
// App Store Guideline 1.2 (User-Generated Content) requires "a method for
// filtering objectionable content". Every post and comment is screened here
// before it is stored or shown. This is a first line of defence in addition to
// the user-facing Report / Block tools and the 24-hour moderation commitment.

// Clearly objectionable terms: slurs / hate speech, sexual-explicit terms, and
// self-harm promotion. Matched case-insensitively on word boundaries, with a
// little leet-speak normalisation so trivial obfuscation is still caught. Kept
// deliberately conservative to avoid false positives on legitimate health talk
// (e.g. "breast", "period", "vaginal", "sex" as in biological sex are allowed).
const BLOCKED = [
  // hate / slurs
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'tranny', 'kike', 'spic', 'chink', 'coon', 'wetback',
  // sexual-explicit
  'cunt', 'whore', 'slut', 'porn', 'creampie', 'blowjob', 'cumshot', 'dildo', 'jizz', 'handjob', 'gangbang',
  // threats / self-harm promotion
  'kill yourself', 'kys', 'go die', 'kill you',
];

// Map common leet substitutions back to letters so "n1gg3r" → "nigger".
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't');
}

// Returns a human-readable reason if the text contains objectionable content,
// or null if it is clean.
export function screenText(raw) {
  const norm = normalize(raw);
  for (const term of BLOCKED) {
    // Multi-word phrases: plain substring on the normalized text.
    if (term.includes(' ')) {
      if (norm.includes(term)) return 'This looks like it contains abusive or objectionable language.';
      continue;
    }
    // Single words: require word boundaries so we don't flag substrings inside
    // legitimate words.
    const re = new RegExp(`\\b${term}\\b`, 'i');
    if (re.test(norm)) return 'This looks like it contains abusive or objectionable language.';
  }
  return null;
}
