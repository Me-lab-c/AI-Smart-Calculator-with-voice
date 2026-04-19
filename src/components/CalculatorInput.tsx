import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeech";

interface CalculatorInputProps {
  onSubmit: (query: string) => void;
}

export interface CalculatorInputRef {
  appendText: (text: string) => void;
}

export const CalculatorInput = forwardRef<CalculatorInputRef, CalculatorInputProps>(
  ({ onSubmit }, ref) => {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const { isListening, startListening, stopListening } = useSpeechRecognition();

    useEffect(() => { inputRef.current?.focus(); }, []);

    useImperativeHandle(ref, () => ({
      appendText(text: string) {
        setQuery(prev => prev + text);
        inputRef.current?.focus();
      },
    }));

    const handleSubmit = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!query.trim()) return;
      onSubmit(query.trim());
      setQuery("");
    };

    const handleMic = () => {
      if (isListening) {
        stopListening();
      } else {
        startListening((text) => {
          setQuery(text);
          setTimeout(() => onSubmit(text), 300);
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "sin 30" or "square root of 144"'
            className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
        </div>
        <div className="relative">
          {isListening && <span className="absolute inset-0 rounded-xl bg-destructive/30 animate-pulse-ring" />}
          <Button type="button" size="icon" variant={isListening ? "destructive" : "secondary"} className="h-12 w-12 rounded-xl shrink-0" onClick={handleMic}>
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        </div>
        <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shrink-0" style={{ background: "var(--hero-gradient)" }} disabled={!query.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </form>
    );
  }
);

CalculatorInput.displayName = "CalculatorInput";
