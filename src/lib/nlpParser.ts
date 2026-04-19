/**
 * Scientific NLP Math Parser
 * Uses mathjs for safe evaluation. Supports trig, log, constants, factorial, powers, roots.
 */

import { evaluate, pi, e as euler } from "mathjs";

// ─── Word-to-number mapping ───────────────────────────────────────────────────

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000, million: 1000000, billion: 1000000000,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type MathIntent =
  | "addition" | "subtraction" | "multiplication" | "division"
  | "exponentiation" | "square" | "cube" | "square_root" | "cube_root"
  | "modulo" | "percentage" | "factorial"
  | "trigonometry" | "logarithm" | "constant"
  | "compound" | "direct_expression";

interface IntentMatch {
  intent: MathIntent;
  label: string;
  confidence: number;
}

export interface ExtractedEntity {
  type: "number" | "operator" | "function";
  value: string;
  raw: string;
  position: number;
}

export interface ParseResult {
  expression: string;
  result: number;
  steps: string[];
  intent: MathIntent;
  intentLabel: string;
  entities: ExtractedEntity[];
  confidence: number;
}

// ─── Normalize ────────────────────────────────────────────────────────────────

function normalizeInput(text: string): string {
  let s = text.toLowerCase().trim();
  s = s.replace(/\b(what\s+is|calculate|compute|find|tell\s+me|can\s+you|please|the|a|an|of)\b/gi, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function convertWordNumbers(text: string): string {
  let result = text;

  // "twenty three" → 23
  const compoundPattern = /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]+(one|two|three|four|five|six|seven|eight|nine)\b/gi;
  result = result.replace(compoundPattern, (_, tens, ones) =>
    String((WORD_NUMBERS[tens.toLowerCase()] || 0) + (WORD_NUMBERS[ones.toLowerCase()] || 0))
  );

  // "X hundred (and) Y"
  result = result.replace(/\b(\w+)\s+hundred\s*(?:and\s+)?(\w+)?\b/gi, (match, h, rest) => {
    const hundreds = WORD_NUMBERS[h.toLowerCase()];
    if (hundreds === undefined) return match;
    const rem = rest ? (WORD_NUMBERS[rest.toLowerCase()] ?? (parseInt(rest) || 0)) : 0;
    return String(hundreds * 100 + rem);
  });

  // Single word numbers
  const sortedWords = Object.keys(WORD_NUMBERS).sort((a, b) => b.length - a.length);
  for (const word of sortedWords) {
    result = result.replace(new RegExp(`\\b${word}\\b`, "gi"), String(WORD_NUMBERS[word]));
  }

  return result;
}

// ─── Intent detection ─────────────────────────────────────────────────────────

const INTENT_PATTERNS: { intent: MathIntent; label: string; patterns: RegExp[]; priority: number }[] = [
  { intent: "trigonometry", label: "Trigonometry", patterns: [/\b(sin|cos|tan|asin|acos|atan|sine|cosine|tangent)\b/i], priority: 10 },
  { intent: "logarithm", label: "Logarithm", patterns: [/\b(log|ln|logarithm)\b/i], priority: 10 },
  { intent: "constant", label: "Constant", patterns: [/\b(pi|euler)\b/i], priority: 9 },
  { intent: "cube_root", label: "Cube Root", patterns: [/cube\s*root/i], priority: 10 },
  { intent: "square_root", label: "Square Root", patterns: [/square\s*root/i, /sqrt/i, /\broot\b/i], priority: 10 },
  { intent: "cube", label: "Cube (x³)", patterns: [/cube\s+(?:of\s+)?(\d)/i, /cubed/i], priority: 9 },
  { intent: "square", label: "Square (x²)", patterns: [/square\s+(?:of\s+)?(\d)/i, /squared/i], priority: 9 },
  { intent: "exponentiation", label: "Exponentiation", patterns: [/power/i, /raised\s+to/i, /exponent/i, /\^/], priority: 8 },
  { intent: "factorial", label: "Factorial", patterns: [/factorial/i, /!/], priority: 8 },
  { intent: "percentage", label: "Percentage", patterns: [/percent/i, /%\s*of/i], priority: 7 },
  { intent: "modulo", label: "Modulo", patterns: [/\bmod(?:ulo)?\b/i, /\bremainder\b/i], priority: 7 },
  { intent: "addition", label: "Addition", patterns: [/\badd\b/i, /\bplus\b/i, /\bsum\b/i], priority: 5 },
  { intent: "subtraction", label: "Subtraction", patterns: [/\bsubtract\b/i, /\bminus\b/i, /\bdifference\b/i], priority: 5 },
  { intent: "multiplication", label: "Multiplication", patterns: [/\bmultipl\w*/i, /\btimes\b/i, /\bproduct\b/i], priority: 5 },
  { intent: "division", label: "Division", patterns: [/\bdivid\w*/i, /\bover\b/i], priority: 5 },
];

function detectIntents(text: string): IntentMatch[] {
  const matches: IntentMatch[] = [];
  for (const { intent, label, patterns, priority } of INTENT_PATTERNS) {
    for (const p of patterns) {
      if (p.test(text)) { matches.push({ intent, label, confidence: priority / 10 }); break; }
    }
  }
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches;
}

// ─── Entity extraction ────────────────────────────────────────────────────────

function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const numRegex = /-?\d+\.?\d*/g;
  let match;
  while ((match = numRegex.exec(text)) !== null) {
    entities.push({ type: "number", value: match[0], raw: match[0], position: match.index });
  }
  return entities;
}

// ─── Expression builder ───────────────────────────────────────────────────────

function buildExpression(originalText: string, steps: string[]): { expression: string; intents: IntentMatch[] } {
  const normalized = normalizeInput(originalText);
  steps.push(`🔤 Normalized: "${normalized}"`);

  const withNumbers = convertWordNumbers(normalized);
  steps.push(`🔢 Numbers extracted: "${withNumbers}"`);

  const intents = detectIntents(originalText.toLowerCase());
  if (intents.length > 0) {
    steps.push(`🎯 Intents: ${intents.map(i => i.label).join(", ")}`);
  }

  let expr = withNumbers;

  // Constants
  expr = expr.replace(/\bpi\b/gi, String(pi));
  expr = expr.replace(/\beuler\b/gi, String(euler));
  expr = expr.replace(/\be\b/gi, String(euler));

  // Trig (assume degrees for NL input)
  expr = expr.replace(/\b(?:sine|sin)\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `sin(${n} deg)`);
  expr = expr.replace(/\b(?:cosine|cos)\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `cos(${n} deg)`);
  expr = expr.replace(/\b(?:tangent|tan)\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `tan(${n} deg)`);
  expr = expr.replace(/\b(?:asin|arcsin|inverse\s*sin(?:e)?)\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `asin(${n})`);
  expr = expr.replace(/\b(?:acos|arccos|inverse\s*cos(?:ine)?)\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `acos(${n})`);
  expr = expr.replace(/\b(?:atan|arctan|inverse\s*tan(?:gent)?)\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `atan(${n})`);

  // Logarithms
  expr = expr.replace(/\b(?:natural\s*log|ln)\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `log(${n})`);
  expr = expr.replace(/\b(?:log(?:arithm)?)\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `log10(${n})`);

  // Roots
  expr = expr.replace(/square\s*root\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `sqrt(${n})`);
  expr = expr.replace(/cube\s*root\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `cbrt(${n})`);
  expr = expr.replace(/\bsqrt\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `sqrt(${n})`);

  // Powers
  expr = expr.replace(/(-?\d+\.?\d*)\s*squared/gi, (_, n) => `(${n})^2`);
  expr = expr.replace(/(-?\d+\.?\d*)\s*cubed/gi, (_, n) => `(${n})^3`);
  expr = expr.replace(/square\s+(?:of\s+)?(-?\d+\.?\d*)/gi, (_, n) => `(${n})^2`);
  expr = expr.replace(/cube\s+(?:of\s+)?(-?\d+\.?\d*)/gi, (_, n) => `(${n})^3`);
  expr = expr.replace(/(-?\d+\.?\d*)\s*(?:to\s+the\s+power\s+(?:of\s+)?|raised\s+to\s+|power\s+)(-?\d+\.?\d*)/gi, (_, b, e) => `(${b})^(${e})`);

  // Factorial
  expr = expr.replace(/factorial\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, n) => `factorial(${n})`);
  expr = expr.replace(/(-?\d+\.?\d*)\s*factorial/gi, (_, n) => `factorial(${n})`);
  expr = expr.replace(/(-?\d+\.?\d*)\s*!/g, (_, n) => `factorial(${n})`);

  // Percentage
  expr = expr.replace(/(-?\d+\.?\d*)\s*percent\s*(?:of\s*)?(-?\d+\.?\d*)/gi, (_, p, n) => `(${p}/100*${n})`);

  // "subtract X from Y" → Y - X
  const subtractFrom = expr.match(/subtract\s*(?:ed)?\s*(-?\d+\.?\d*)\s*from\s*(-?\d+\.?\d*)/i);
  if (subtractFrom) {
    expr = `${subtractFrom[2]} - ${subtractFrom[1]}`;
    steps.push(`↩️ Reversed: subtract X from Y → ${expr}`);
    return { expression: expr, intents };
  }

  // "divide X into Y" → Y / X
  const divideInto = expr.match(/divid\w*\s*(-?\d+\.?\d*)\s*into\s*(-?\d+\.?\d*)/i);
  if (divideInto) {
    expr = `${divideInto[2]} / ${divideInto[1]}`;
    steps.push(`↩️ Reversed: divide X into Y → ${expr}`);
    return { expression: expr, intents };
  }

  // Operator keywords → symbols
  expr = expr.replace(/\bplus\b|\badd(?:ed)?\s*(?:to)?\b|\bsum\b/gi, "+");
  expr = expr.replace(/\bminus\b|\bsubtract(?:ed)?\s*(?:from)?\b|\bless\b|\bdifference\b/gi, "-");
  expr = expr.replace(/\btimes\b|\bmultipl(?:y|ied)\s*(?:by)?\b|\bproduct\b/gi, "*");
  expr = expr.replace(/\bdivid(?:e|ed)\s*(?:by)?\b|\bover\b/gi, "/");
  expr = expr.replace(/\bmod(?:ulo)?\b|\bremainder\b/gi, "%");
  expr = expr.replace(/\bby\b/gi, "");

  // Clean up non-math chars
  expr = expr.replace(/[^0-9+\-*/().^%\s,a-z_]/gi, "").replace(/\s+/g, " ").trim();

  steps.push(`🧮 Expression: ${expr}`);
  return { expression: expr, intents };
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function parseAndCalculate(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Please enter a math question.");

  const steps: string[] = [];
  steps.push(`📝 Input: "${trimmed}"`);

  const normalizedForEntities = convertWordNumbers(normalizeInput(trimmed));
  const entities = extractEntities(normalizedForEntities);

  const { expression, intents } = buildExpression(trimmed, steps);
  steps.push(`📊 Final expression: ${expression}`);

  let result: number;
  try {
    result = evaluate(expression);
  } catch (err: any) {
    throw new Error(`Could not evaluate "${expression}": ${err.message}`);
  }

  if (typeof result !== "number" || !isFinite(result)) {
    // mathjs may return a ResultSet or BigNumber — try to coerce
    const num = Number(result);
    if (isNaN(num)) throw new Error("Result is not a valid number.");
    result = num;
  }

  result = Math.round(result * 1e10) / 1e10;
  steps.push(`✅ Result: ${result}`);

  const displayExpression = expression
    .replace(/\*/g, " × ")
    .replace(/\//g, " ÷ ");

  const primaryIntent = intents[0] || { intent: "direct_expression" as MathIntent, label: "Expression", confidence: 0.5 };

  return {
    expression: displayExpression,
    result,
    steps,
    intent: primaryIntent.intent,
    intentLabel: primaryIntent.label,
    entities,
    confidence: primaryIntent.confidence,
  };
}
