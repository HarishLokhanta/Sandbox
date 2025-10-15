/**
 * Format suburb name for Microburbs API
 * Converts spaces to + exactly as the API expects
 * Example: "Belmont North" → "Belmont+North"
 */
export function toPlusSuburb(input: string): string {
  return input.trim().replace(/\s+/g, "+");
}
