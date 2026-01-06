import { useState, useEffect } from "react";
import PriceDisplay from "@/components/PriceDisplay";
import SignalIndicator from "@/components/SignalIndicator";
import MetricCard from "@/components/MetricCard";
import SignalHistory from "@/components/SignalHistory";
import TradingChart from "@/components/TradingChart";
import ConnectionStatus from "@/components/ConnectionStatus";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import ControlPanel from "@/components/ControlPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { Activity, Target, Zap } from "lucide-react";
import { wsClient } from "@/lib/websocket";
import { type Signal, type Candle } from "@shared/schema";

interface MetricsData {
  accuracy: number;
  precision: number;
  recall: number;
  totalSignals: number;
  correctSignals: number;
  dynamicSuccessRate: number;
}

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(1.08734);
  const [priceChange, setPriceChange] = useState(0.00123);
  const [priceChangePercent, setPriceChangePercent] = useState(0.11);
  const [latency, setLatency] = useState(45);
  const [lastUpdate, setLastUpdate] = useState("2s ago");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [latestSignal, setLatestSignal] = useState<Signal | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({
    accuracy: 0.673,
    precision: 0.71,
    recall: 0.68,
    totalSignals: 0,
    correctSignals: 0,
    dynamicSuccessRate: 0.673,
  });

  useEffect(() => {
    // Connect to WebSocket
    wsClient.connect();

    // Connection status listener
    wsClient.on("connection", (data: { connected: boolean }) => {
      setIsConnected(data.connected);
    });

    // Initial state listener
    wsClient.on("initial_state", (data: any) => {
      console.log("[Dashboard] Received initial state:", data);
      
      if (data.signals && data.signals.length > 0) {
        setSignals(data.signals);
        setLatestSignal(data.signals[0]);
      }
      
      if (data.metrics) {
        setMetrics({
          accuracy: data.metrics.accuracy || 0.673,
          precision: data.metrics.precision || 0.71,
          recall: data.metrics.recall || 0.68,
          totalSignals: data.metrics.totalSignals || 0,
          correctSignals: data.metrics.correctSignals || 0,
          dynamicSuccessRate: data.metrics.dynamicSuccessRate || 0.673,
        });
      }

      if (data.ticks && data.ticks.length > 0) {
        const latestTick = data.ticks[0];
        setCurrentPrice(latestTick.mid);
      }

      if (data.candles && data.candles.length > 0) {
        const sorted = [...data.candles].sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
        setCandles(sorted);
      }
    });

    // Candle update listener
    wsClient.on("candle_update", (candle: Candle) => {
      setCandles((prev) => {
        const existingIndex = prev.findIndex(
          (c) => new Date(c.timestamp).getTime() === new Date(candle.timestamp).getTime()
        );
        let updated;
        if (existingIndex >= 0) {
          updated = [...prev];
          updated[existingIndex] = candle;
        } else {
          updated = [...prev, candle];
        }
        // Ensure strictly sorted and limited to last 50 (Oldest to Newest)
        return updated
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-50);
      });
    });

    // Tick listener
    wsClient.on("tick", (tick: any) => {
      const newPrice = tick.mid;
      const prevPrice = currentPrice || tick.mid;
      const change = newPrice - prevPrice;
      const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
      
      setCurrentPrice(newPrice);
      setPriceChange(change);
      setPriceChangePercent(changePercent);
      setLastUpdate("just now");
    });

    // Signal listener
    wsClient.on("signal", (signal: Signal) => {
      console.log("[Dashboard] New signal:", signal);
      setLatestSignal(signal);
      setSignals((prev) => {
        const updated = [signal, ...prev];
        return updated
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 20);
      });
    });

    // Metrics listener
    wsClient.on("metrics", (metricsData: any) => {
      console.log("[Dashboard] Metrics update:", metricsData);
      if (metricsData) {
        setMetrics({
          accuracy: metricsData.accuracy || metrics.accuracy,
          precision: metricsData.precision || metrics.precision,
          recall: metricsData.recall || metrics.recall,
          totalSignals: metricsData.totalSignals || metrics.totalSignals,
          correctSignals: metricsData.correctSignals || metrics.correctSignals,
          dynamicSuccessRate: metricsData.dynamicSuccessRate || metrics.dynamicSuccessRate,
        });
      }
    });

    return () => {
      wsClient.disconnect();
    };
  }, []);

  const handlePlayPause = async (running: boolean) => {
    setIsRunning(running);
    try {
      const endpoint = running ? "/api/control/start" : "/api/control/stop";
      await fetch(endpoint, { method: "POST" });
    } catch (error) {
      console.error("Error controlling simulation:", error);
    }
  };

  const formatSignalsForHistory = (sigs: Signal[]) => {
    return sigs.map((s) => ({
      id: s.id,
      timestamp: new Date(s.timestamp).toLocaleTimeString(),
      direction: s.direction as "UP" | "DOWN",
      probability: s.probability,
      result: s.isCorrect !== null && s.isCorrect !== undefined 
        ? (s.isCorrect ? "correct" as const : "incorrect" as const)
        : undefined,
      actualMove: s.priceAfterMinute && s.priceAtPrediction 
        ? s.priceAfterMinute - s.priceAtPrediction
        : undefined,
    }));
  };

  const getTimeAgo = (timestamp: Date): string => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold">TradingML</h1>
            </div>
            <ConnectionStatus isConnected={isConnected} latency={latency} lastUpdate={lastUpdate} />
          </div>
          
          <div className="flex items-center gap-2">
            <ControlPanel 
              onPlayPause={handlePlayPause}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-4">
              <PriceDisplay 
                price={currentPrice} 
                change={priceChange} 
                changePercent={priceChangePercent} 
              />
              
              {latestSignal ? (
                <SignalIndicator 
                  direction={latestSignal.direction as "UP" | "DOWN"}
                  probability={latestSignal.probability} 
                  timestamp={getTimeAgo(latestSignal.timestamp)}
                />
              ) : (
                <SignalIndicator 
                  direction="NEUTRAL"
                  probability={0.5} 
                  timestamp="Waiting..."
                />
              )}
            </div>

            <PerformanceMetrics 
              successRate={metrics.dynamicSuccessRate}
              precision={metrics.precision}
              recall={metrics.recall}
              totalSignals={metrics.totalSignals}
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <TradingChart candles={candles} signals={signals} height="500px" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                title="Accuracy" 
                value={`${(metrics.accuracy * 100).toFixed(1)}%`}
                subtitle="Last 100 signals"
                icon={Activity}
                trend={{ value: 2.4, isPositive: true }}
              />
              <MetricCard 
                title="Total Signals" 
                value={metrics.totalSignals.toString()}
                subtitle="This session"
                icon={Target}
              />
              <MetricCard 
                title="Avg Confidence" 
                value="71.2%" 
                subtitle="Current model"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <SignalHistory signals={formatSignalsForHistory(signals)} maxHeight="calc(100vh - 200px)" />
          </div>
        </div>
      </main>
    </div>
  );
}
