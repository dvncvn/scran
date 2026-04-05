/** Common fraction mappings for display */
const DISPLAY_FRACTIONS: [number, string][] = [
  [0.125, "⅛"],
  [0.25, "¼"],
  [0.333, "⅓"],
  [0.5, "½"],
  [0.667, "⅔"],
  [0.75, "¾"],
];

const TOLERANCE = 0.02;

/**
 * Parse a quantity string that may contain fractions.
 * Supports: "1/3", "1/2", "1 1/2", "0.5", "2", "3/4"
 * Returns NaN if unparseable.
 */
export function parseFraction(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return NaN;

  // Pure number
  const asNum = Number(trimmed);
  if (!isNaN(asNum)) return asNum;

  // Mixed number: "1 1/2" or "2 3/4"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const num = parseInt(mixedMatch[2]);
    const den = parseInt(mixedMatch[3]);
    if (den === 0) return NaN;
    return whole + num / den;
  }

  // Simple fraction: "1/3", "3/4"
  const fracMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1]);
    const den = parseInt(fracMatch[2]);
    if (den === 0) return NaN;
    return num / den;
  }

  return NaN;
}

/**
 * Format a number as a human-readable quantity with fraction symbols.
 * e.g. 0.5 → "½", 1.5 → "1 ½", 0.333 → "⅓", 2 → "2"
 */
export function formatQuantity(value: number): string {
  if (value <= 0) return "0";

  const whole = Math.floor(value);
  const frac = value - whole;

  // No fractional part
  if (frac < TOLERANCE) {
    return whole.toString();
  }

  // Find matching fraction symbol
  for (const [decimal, symbol] of DISPLAY_FRACTIONS) {
    if (Math.abs(frac - decimal) < TOLERANCE) {
      return whole > 0 ? `${whole} ${symbol}` : symbol;
    }
  }

  // No nice fraction — show decimal, trimmed
  const rounded = Math.round(value * 100) / 100;
  return rounded.toString();
}
