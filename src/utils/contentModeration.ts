/**
 * Content Moderation Utility for Language Filtering
 * Filters offensive, abusive, or inappropriate words in Hebrew and English.
 */

// Hebrew and English offensive / inappropriate words dictionary
const BAD_WORDS_HEBREW = [
  'זבל', 'טיפש', 'מפגר', 'אידיוט', 'זונה', 'שרמוטה', 'מנוול', 'חרא',
  'כסיל', 'דביל', 'זבלון', 'אפס', 'כושל', 'מכוער', 'אדיוט', 'שרמוט',
  'זילזול', 'נבל', 'מגעיל', 'טמבל', 'פגוע', 'שונא', 'הרס', 'קללה',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'idiot', 'stupid', 'crap',
  'slut', 'dick', 'pussy', 'nigger', 'faggot', 'whore', 'retard'
];

export interface ModerationResult {
  isClean: boolean;
  blockedWord?: string;
  sanitizedText: string;
  warningMessage?: string;
}

/**
 * Checks if the given text contains offensive or inappropriate language.
 */
export function checkContentModeration(text: string): ModerationResult {
  if (!text || typeof text !== 'string') {
    return { isClean: true, sanitizedText: text || '' };
  }

  const cleanInput = text.trim();
  const lowerInput = cleanInput.toLowerCase();

  // Normalize Hebrew text for better matching (remove punctuation)
  const normalizedWords = lowerInput
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/);

  for (const badWord of BAD_WORDS_HEBREW) {
    const regex = new RegExp(`\\b${badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    
    // Check both exact word match and regex match
    const hasBadWord = normalizedWords.some((word) => word === badWord) || regex.test(lowerInput);

    if (hasBadWord) {
      // Replace bad word with asterisks for sanitized version
      const sanitized = cleanInput.replace(
        new RegExp(badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
        '***'
      );

      return {
        isClean: false,
        blockedWord: badWord,
        sanitizedText: sanitized,
        warningMessage: `המילה "${badWord}" אינה הולמת. אנא שמור על שיח מכבד, חיובי ומעודד בקהילה! 🙏`,
      };
    }
  }

  return {
    isClean: true,
    sanitizedText: cleanInput,
  };
}

/**
 * Masks any offensive words in text with asterisks.
 */
export function maskOffensiveWords(text: string): string {
  if (!text) return '';
  let result = text;
  for (const badWord of BAD_WORDS_HEBREW) {
    const regex = new RegExp(badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, '***');
  }
  return result;
}
