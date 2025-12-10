import { useMemo, useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
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
  signal?: {
    direction: string;
    probability: number;
    isCorrect: boolean | null;
  };
}

export default function TradingChart({ candles, signals = [], height = "500px" }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: CandleData } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

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
    const padding = (max - min) * 0.15 || 0.0005;

    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      latestPrice: chartData[chartData.length - 1]?.close || 1.085,
    };
  }, [chartData]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 80, bottom: 40, left: 20 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;

    ctx.fillStyle = "hsl(240, 10%, 3.9%)";
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    const priceRange = maxPrice - minPrice;
    const priceToY = (price: number) => {
      return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(dimensions.width - padding.right, y);
      ctx.stroke();

      const price = maxPrice - (priceRange / gridLines) * i;
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(price.toFixed(5), dimensions.width - padding.right + 8, y + 4);
    }

    const candleWidth = Math.max(4, Math.min(20, (chartWidth / chartData.length) * 0.7));
    const candleSpacing = chartWidth / chartData.length;

    chartData.forEach((candle, i) => {
      const x = padding.left + candleSpacing * i + candleSpacing / 2;
      
      const bullish = candle.bullish;
      const bodyColor = bullish ? "#22c55e" : "#ef4444";
      const wickColor = bullish ? "#16a34a" : "#dc2626";

      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);

      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));

      ctx.fillStyle = bodyColor;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      if (candle.signal) {
        const signalColor = candle.signal.direction === "UP" ? "#22c55e" : "#ef4444";
        ctx.fillStyle = signalColor;
        ctx.beginPath();
        if (candle.signal.direction === "UP") {
          ctx.moveTo(x, highY - 15);
          ctx.lineTo(x - 6, highY - 5);
          ctx.lineTo(x + 6, highY - 5);
        } else {
          ctx.moveTo(x, lowY + 15);
          ctx.lineTo(x - 6, lowY + 5);
          ctx.lineTo(x + 6, lowY + 5);
        }
        ctx.closePath();
        ctx.fill();
      }

      if (i % Math.max(1, Math.floor(chartData.length / 8)) === 0 || i === chartData.length - 1) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(candle.time, x, dimensions.height - padding.bottom + 20);
      }
    });

    const latestY = priceToY(latestPrice);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, latestY);
    ctx.lineTo(dimensions.width - padding.right, latestY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(dimensions.width - padding.right, latestY - 10, padding.right - 5, 20);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(latestPrice.toFixed(5), dimensions.width - padding.right + 5, latestY + 4);

  }, [chartData, dimensions, minPrice, maxPrice, latestPrice]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { left: 20, right: 80 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const candleSpacing = chartWidth / chartData.length;
    
    const index = Math.floor((x - padding.left) / candleSpacing);
    if (index >= 0 && index < chartData.length) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        data: chartData[index],
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
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
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
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

      <div 
        ref={containerRef}
        className="relative rounded-lg border overflow-hidden" 
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ width: "100%", height: "100%" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {tooltip && (
          <div
            className="absolute bg-popover border rounded-lg p-3 shadow-lg pointer-events-none z-10"
            style={{
              left: Math.min(tooltip.x + 10, dimensions.width - 180),
              top: Math.min(tooltip.y + 10, dimensions.height - 150),
            }}
          >
            <div className="text-sm font-medium mb-2">{tooltip.data.time}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Open:</span>
              <span className="font-mono">{tooltip.data.open.toFixed(5)}</span>
              <span className="text-muted-foreground">High:</span>
              <span className="font-mono">{tooltip.data.high.toFixed(5)}</span>
              <span className="text-muted-foreground">Low:</span>
              <span className="font-mono">{tooltip.data.low.toFixed(5)}</span>
              <span className="text-muted-foreground">Close:</span>
              <span className={`font-mono ${tooltip.data.bullish ? "text-green-500" : "text-red-500"}`}>
                {tooltip.data.close.toFixed(5)}
              </span>
            </div>
            {tooltip.data.signal && (
              <div className="mt-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      tooltip.data.signal.direction === "UP"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {tooltip.data.signal.direction}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(tooltip.data.signal.probability * 100).toFixed(1)}%
                  </span>
                  {tooltip.data.signal.isCorrect !== null && (
                    <span className={tooltip.data.signal.isCorrect ? "text-green-500" : "text-red-500"}>
                      {tooltip.data.signal.isCorrect ? "Correcto" : "Incorrecto"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
