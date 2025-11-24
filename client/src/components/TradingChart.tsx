import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { type Candle, type Signal } from "@shared/schema";

interface TradingChartProps {
  candles: Candle[];
  signals?: Signal[];
  height?: string;
}

interface CandleData {
  time: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  bullish: boolean;
  body: [number, number];
  wick: [number, number];
  signal?: {
    direction: string;
    probability: number;
    isCorrect: boolean | null;
  };
}

export default function TradingChart({ candles, signals = [], height = "500px" }: TradingChartProps) {
  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) return [];

    const signalMap = new Map<string, { direction: string; probability: number; isCorrect: boolean | null }>();
    
    signals.forEach((s) => {
      try {
        if (s.timestamp) {
          const date = new Date(s.timestamp);
          if (!isNaN(date.getTime())) {
            const key = date.toISOString().slice(0, 16);
            signalMap.set(key, { 
              direction: s.direction, 
              probability: s.probability, 
              isCorrect: s.isCorrect 
            });
          }
        }
      } catch {
      }
    });

    return candles.map((candle): CandleData => {
      const time = new Date(candle.timestamp);
      const isValidTime = !isNaN(time.getTime());
      const timeKey = isValidTime ? time.toISOString().slice(0, 16) : "";
      const bullish = candle.close >= candle.open;

      return {
        time: isValidTime 
          ? time.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
          : "--:--",
        timestamp: time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        bullish,
        body: bullish ? [candle.open, candle.close] : [candle.close, candle.open],
        wick: [candle.low, candle.high],
        signal: signalMap.get(timeKey),
      };
    });
  }, [candles, signals]);

  const { minPrice, maxPrice, latestPrice } = useMemo(() => {
    if (chartData.length === 0) {
      return { minPrice: 1.08, maxPrice: 1.09, latestPrice: 1.085 };
    }

    const lows = chartData.map((d) => d.low);
    const highs = chartData.map((d) => d.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.1 || 0.0005;

    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      latestPrice: chartData[chartData.length - 1]?.close || 1.085,
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload as CandleData;
    if (!data) return null;

    return (
      <div className="bg-popover border rounded-lg p-3 shadow-lg">
        <div className="text-sm font-medium mb-2">{data.time}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Open:</span>
          <span className="font-mono">{data.open.toFixed(5)}</span>
          <span className="text-muted-foreground">High:</span>
          <span className="font-mono">{data.high.toFixed(5)}</span>
          <span className="text-muted-foreground">Low:</span>
          <span className="font-mono">{data.low.toFixed(5)}</span>
          <span className="text-muted-foreground">Close:</span>
          <span className={`font-mono ${data.bullish ? "text-green-500" : "text-red-500"}`}>
            {data.close.toFixed(5)}
          </span>
        </div>
        {data.signal && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  data.signal.direction === "UP"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
                }`}
              >
                {data.signal.direction}
              </span>
              <span className="text-xs text-muted-foreground">
                {(data.signal.probability * 100).toFixed(1)}%
              </span>
              {data.signal.isCorrect !== null && (
                <span className={data.signal.isCorrect ? "text-green-500" : "text-red-500"}>
                  {data.signal.isCorrect ? "✓" : "✗"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card className="p-4" data-testid="card-trading-chart">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="text-lg font-semibold">EUR/USD - 1 Minute</h3>
          </div>
        </div>
        <div
          className="relative rounded-lg border bg-card/50 flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center space-y-2">
            <div className="animate-pulse flex space-x-1 justify-center">
              <div className="w-2 h-8 bg-muted-foreground/30 rounded" />
              <div className="w-2 h-12 bg-muted-foreground/30 rounded" />
              <div className="w-2 h-6 bg-muted-foreground/30 rounded" />
              <div className="w-2 h-10 bg-muted-foreground/30 rounded" />
              <div className="w-2 h-8 bg-muted-foreground/30 rounded" />
            </div>
            <div className="text-muted-foreground text-sm">Esperando datos de velas...</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4" data-testid="card-trading-chart">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          <h3 className="text-lg font-semibold">EUR/USD - 1 Minute</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <span className="text-muted-foreground">Alcista</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
              <span className="text-muted-foreground">Bajista</span>
            </div>
          </div>
          <div className="text-sm font-mono">
            <span className="text-muted-foreground">Precio: </span>
            <span className="font-semibold">{latestPrice.toFixed(5)}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card/50" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 60, bottom: 20, left: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted-foreground) / 0.2)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              orientation="right"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              tickFormatter={(value) => value.toFixed(5)}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={latestPrice}
              stroke="hsl(var(--primary))"
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <Bar dataKey="wick" barSize={1} isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`wick-${index}`}
                  fill={entry.bullish ? "#22c55e" : "#ef4444"}
                />
              ))}
            </Bar>
            <Bar dataKey="body" barSize={8} isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`body-${index}`}
                  fill={entry.bullish ? "#22c55e" : "#ef4444"}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
