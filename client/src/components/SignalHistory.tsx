import { ArrowUp, ArrowDown, Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Signal {
  id: string;
  timestamp: string;
  direction: "UP" | "DOWN";
  probability: number;
  result?: "correct" | "incorrect";
  actualMove?: number;
}

interface SignalHistoryProps {
  signals: Signal[];
  maxHeight?: string;
}

export default function SignalHistory({ signals, maxHeight = "400px" }: SignalHistoryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Signal History</h3>
        <span className="text-sm text-muted-foreground">{signals.length} signals</span>
      </div>
      <ScrollArea style={{ height: maxHeight }}>
        <div className="space-y-2 pr-4">
          {signals.map((signal, index) => (
            <div 
              key={signal.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover-elevate"
              data-testid={`row-signal-${index}`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-md ${
                  signal.direction === "UP" 
                    ? "bg-trading-bullish/10 text-trading-bullish" 
                    : "bg-trading-bearish/10 text-trading-bearish"
                }`}>
                  {signal.direction === "UP" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{signal.timestamp}</span>
                    <span className={`text-sm font-medium ${
                      signal.direction === "UP" ? "text-trading-bullish" : "text-trading-bearish"
                    }`}>
                      {signal.direction}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          signal.direction === "UP" ? "bg-trading-bullish" : "bg-trading-bearish"
                        }`}
                        style={{ width: `${signal.probability * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs">{(signal.probability * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              {signal.result && (
                <div className={`p-1.5 rounded-md ${
                  signal.result === "correct" 
                    ? "bg-trading-bullish/10 text-trading-bullish" 
                    : "bg-trading-bearish/10 text-trading-bearish"
                }`}>
                  {signal.result === "correct" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
