import { useState } from "react";
import { Volume2, ChevronDown, ChevronUp, Brain, Hash, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakText } from "@/hooks/useSpeech";
import type { ParseResult } from "@/lib/nlpParser";

interface ResultCardProps {
  query: string;
  result: ParseResult;
  isLatest?: boolean;
}

export function ResultCard({ query, result, isLatest }: ResultCardProps) {
  const [showSteps, setShowSteps] = useState(false);

  const speak = () => {
    speakText(`The answer is ${result.result}`);
  };

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 shadow-card transition-all ${
        isLatest ? "animate-fade-in-up" : ""
      }`}
    >
      {/* Query */}
      <p className="text-sm text-muted-foreground mb-2">"{query}"</p>

      {/* Intent & Entities badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
          <Target className="h-3 w-3" />
          {result.intentLabel}
        </span>
        {result.entities.slice(0, 4).map((e, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent/15 text-accent-foreground">
            <Hash className="h-3 w-3" />
            {e.value}
          </span>
        ))}
        {result.confidence > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {Math.round(result.confidence * 100)}% confidence
          </span>
        )}
      </div>

      {/* Expression */}
      <p className="text-sm text-secondary-foreground font-mono mb-2 bg-muted rounded-lg px-3 py-1.5">
        {result.expression}
      </p>

      {/* Result */}
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold" style={{ background: "var(--hero-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          = {result.result}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={speak} className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Read aloud">
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSteps(!showSteps)} className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Show steps">
            {showSteps ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Steps */}
      {showSteps && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">NLP Interpretation Pipeline</p>
          </div>
          <ol className="space-y-1">
            {result.steps.map((step, i) => (
              <li key={i} className="text-xs text-muted-foreground font-mono leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
