import { Button } from "@/components/ui/button";

interface ScientificKeypadProps {
  onInsert: (text: string) => void;
}

const BUTTONS: { label: string; insert: string; className?: string }[][] = [
  [
    { label: "sin", insert: "sin " },
    { label: "cos", insert: "cos " },
    { label: "tan", insert: "tan " },
    { label: "π", insert: "pi " },
    { label: "e", insert: "euler " },
  ],
  [
    { label: "asin", insert: "asin " },
    { label: "acos", insert: "acos " },
    { label: "atan", insert: "atan " },
    { label: "log", insert: "log " },
    { label: "ln", insert: "ln " },
  ],
  [
    { label: "√", insert: "square root of " },
    { label: "∛", insert: "cube root of " },
    { label: "x²", insert: " squared" },
    { label: "x³", insert: " cubed" },
    { label: "n!", insert: " factorial" },
  ],
  [
    { label: "7", insert: "7" },
    { label: "8", insert: "8" },
    { label: "9", insert: "9" },
    { label: "÷", insert: " divided by " },
    { label: "(", insert: "(" },
  ],
  [
    { label: "4", insert: "4" },
    { label: "5", insert: "5" },
    { label: "6", insert: "6" },
    { label: "×", insert: " times " },
    { label: ")", insert: ")" },
  ],
  [
    { label: "1", insert: "1" },
    { label: "2", insert: "2" },
    { label: "3", insert: "3" },
    { label: "−", insert: " minus " },
    { label: "^", insert: " power " },
  ],
  [
    { label: "0", insert: "0" },
    { label: ".", insert: "." },
    { label: "%", insert: " percent of " },
    { label: "+", insert: " plus " },
    { label: "mod", insert: " mod " },
  ],
];

export function ScientificKeypad({ onInsert }: ScientificKeypadProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-card space-y-1.5">
      {BUTTONS.map((row, ri) => (
        <div key={ri} className="grid grid-cols-5 gap-1.5">
          {row.map((btn) => (
            <Button
              key={btn.label}
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 text-xs font-medium rounded-lg"
              onClick={() => onInsert(btn.insert)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}
