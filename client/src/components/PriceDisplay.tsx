import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceDisplayProps {
  price: number;
  change: number;
  changePercent: number;
  pair?: string;
}

export default function PriceDisplay({ price, change, changePercent, pair = "EUR/USD" }: PriceDisplayProps) {
  const isPositive = change >= 0;
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">{pair}</div>
      <div className="flex items-baseline gap-3">
        <div className="text-5xl font-semibold font-mono tracking-tight">
          {price.toFixed(5)}
        </div>
        <div className={`flex items-center gap-1 text-lg font-mono ${
          isPositive ? "text-trading-bullish" : "text-trading-bearish"
        }`}>
          {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          <span>{isPositive ? "+" : ""}{change.toFixed(5)}</span>
          <span className="text-sm">({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    </div>
  );
}
