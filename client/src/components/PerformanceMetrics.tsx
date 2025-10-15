import { Card } from "@/components/ui/card";
import { Target, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PerformanceMetricsProps {
  successRate: number;
  precision: number;
  recall: number;
  totalSignals: number;
}

export default function PerformanceMetrics({ 
  successRate, 
  precision, 
  recall, 
  totalSignals 
}: PerformanceMetricsProps) {
  const getPerformanceColor = (rate: number) => {
    if (rate >= 0.65) return "text-trading-bullish";
    if (rate >= 0.55) return "text-chart-3";
    return "text-trading-bearish";
  };

  return (
    <Card className="p-4" data-testid="card-performance">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Performance</h3>
          </div>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="flex items-center justify-center py-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/20"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - successRate)}`}
                className={getPerformanceColor(successRate)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-3xl font-bold font-mono ${getPerformanceColor(successRate)}`}>
                {(successRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="24h" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1h" data-testid="button-timeframe-1h">1H</TabsTrigger>
            <TabsTrigger value="24h" data-testid="button-timeframe-24h">24H</TabsTrigger>
            <TabsTrigger value="7d" data-testid="button-timeframe-7d">7D</TabsTrigger>
          </TabsList>
          <TabsContent value="24h" className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Precision</span>
              <span className="font-mono font-semibold">{(precision * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Recall</span>
              <span className="font-mono font-semibold">{(recall * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Signals</span>
              <span className="font-mono font-semibold">{totalSignals.toLocaleString()}</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
