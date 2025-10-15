import { Card } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

interface TradingChartProps {
  height?: string;
}

export default function TradingChart({ height = "500px" }: TradingChartProps) {
  return (
    <Card className="p-4" data-testid="card-trading-chart">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          <h3 className="text-lg font-semibold">EUR/USD - 1 Minute</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm">
            <div className="w-3 h-3 bg-trading-bullish rounded-sm" />
            <span className="text-muted-foreground">Up</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <div className="w-3 h-3 bg-trading-bearish rounded-sm" />
            <span className="text-muted-foreground">Down</span>
          </div>
        </div>
      </div>
      
      <div 
        className="relative rounded-lg border bg-card/50 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center space-y-3">
          <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto" />
          <div className="text-muted-foreground">
            <div className="font-semibold">Candlestick Chart</div>
            <div className="text-sm">Real-time 1-minute candles with prediction overlays</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
