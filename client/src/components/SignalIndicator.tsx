import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SignalIndicatorProps {
  direction: "UP" | "DOWN" | "NEUTRAL";
  probability: number;
  timestamp?: string;
}

export default function SignalIndicator({ direction, probability, timestamp }: SignalIndicatorProps) {
  const getSignalColor = () => {
    if (direction === "UP") return "text-trading-bullish border-trading-bullish/30 bg-trading-bullish/10";
    if (direction === "DOWN") return "text-trading-bearish border-trading-bearish/30 bg-trading-bearish/10";
    return "text-trading-neutral border-trading-neutral/30 bg-trading-neutral/10";
  };

  const getIcon = () => {
    if (direction === "UP") return <ArrowUp className="w-8 h-8" />;
    if (direction === "DOWN") return <ArrowDown className="w-8 h-8" />;
    return <Minus className="w-8 h-8" />;
  };

  const getConfidenceLevel = () => {
    if (probability >= 0.7) return "High";
    if (probability >= 0.55) return "Medium";
    return "Low";
  };

  return (
    <div className={`rounded-xl border-2 p-6 backdrop-blur-md ${getSignalColor()}`} data-testid="signal-indicator">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <div className="text-2xl font-semibold" data-testid={`text-signal-${direction.toLowerCase()}`}>{direction}</div>
            <div className="text-sm opacity-80">Next Minute Prediction</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm">Confidence</span>
          <span className="font-mono font-semibold" data-testid="text-probability">{(probability * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-background/20 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-current transition-all duration-300"
            style={{ width: `${probability * 100}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className="text-xs border-current/30">
            {getConfidenceLevel()} Confidence
          </Badge>
          {timestamp && (
            <span className="text-xs opacity-70 font-mono">{timestamp}</span>
          )}
        </div>
      </div>
    </div>
  );
}
