import { useState, useRef } from "react";
import { Calculator, Trash2, Brain, Sparkles, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalculatorInput, type CalculatorInputRef } from "@/components/CalculatorInput";
import { ResultCard } from "@/components/ResultCard";
import { ScientificKeypad } from "@/components/ScientificKeypad";
import { parseAndCalculate, type ParseResult } from "@/lib/nlpParser";

interface HistoryEntry {
  id: number;
  query: string;
  result: ParseResult;
}

const EXAMPLE_QUERIES = [
  "sin 30",
  "log of 100",
  "square root of 144",
  "5 factorial",
  "2 power 3 plus 4",
  "Add 5 to the square of 3",
  "Multiply 6 by 2 and subtract 3",
  "ln 2.718",
];

export default function Index() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showKeypad, setShowKeypad] = useState(true);
  const inputRef = useRef<CalculatorInputRef>(null);

  const handleCalculate = (query: string) => {
    setError(null);
    try {
      const result = parseAndCalculate(query);
      setHistory((prev) => [{ id: Date.now(), query, result }, ...prev]);
    } catch (err: any) {
      setError(err.message || "Could not understand the input.");
    }
  };

  const clearHistory = () => { setHistory([]); setError(null); };

  const handleKeypadInsert = (text: string) => {
    inputRef.current?.appendText(text);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "var(--hero-gradient)" }}>
              <Calculator className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-1.5">
                Scientific AI Calculator
                <Sparkles className="h-4 w-4 text-accent" />
              </h1>
              <p className="text-xs text-muted-foreground">NLP + Voice • Trig, Log, Powers & more</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowKeypad(!showKeypad)} className="text-muted-foreground">
              <Grid3X3 className="h-4 w-4" />
            </Button>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        <CalculatorInput ref={inputRef} onSubmit={handleCalculate} />

        {showKeypad && <ScientificKeypad onInsert={handleKeypadInsert} />}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in-up">
            {error}
          </div>
        )}

        {history.length === 0 && !error && (
          <div className="animate-fade-in-up space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Scientific Functions</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>✓ sin, cos, tan (degrees)</div>
                <div>✓ asin, acos, atan</div>
                <div>✓ log (base 10), ln</div>
                <div>✓ Square & cube roots</div>
                <div>✓ Powers & exponents</div>
                <div>✓ Factorial</div>
                <div>✓ Constants (π, e)</div>
                <div>✓ Natural language input</div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map((q) => (
                  <button key={q} onClick={() => handleCalculate(q)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {history.map((entry, i) => (
            <ResultCard key={entry.id} query={entry.query} result={entry.result} isLatest={i === 0} />
          ))}
        </div>
      </main>
    </div>
  );
}
