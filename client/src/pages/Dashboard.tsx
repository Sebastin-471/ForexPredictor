import { useState } from "react";
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

export default function Dashboard() {
  const [isRunning, setIsRunning] = useState(true);

  const mockSignals = [
    { id: "1", timestamp: "14:32:45", direction: "UP" as const, probability: 0.73, result: "correct" as const, actualMove: 0.00012 },
    { id: "2", timestamp: "14:31:45", direction: "DOWN" as const, probability: 0.68, result: "correct" as const, actualMove: -0.00008 },
    { id: "3", timestamp: "14:30:45", direction: "UP" as const, probability: 0.61, result: "incorrect" as const, actualMove: -0.00003 },
    { id: "4", timestamp: "14:29:45", direction: "DOWN" as const, probability: 0.75, result: "correct" as const, actualMove: -0.00015 },
    { id: "5", timestamp: "14:28:45", direction: "UP" as const, probability: 0.58, result: "incorrect" as const, actualMove: -0.00005 },
    { id: "6", timestamp: "14:27:45", direction: "DOWN" as const, probability: 0.82, result: "correct" as const, actualMove: -0.00018 },
    { id: "7", timestamp: "14:26:45", direction: "UP" as const, probability: 0.64, result: "correct" as const, actualMove: 0.00009 },
    { id: "8", timestamp: "14:25:45", direction: "DOWN" as const, probability: 0.59, result: "incorrect" as const, actualMove: 0.00004 },
  ];

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
            <ConnectionStatus isConnected={true} latency={45} lastUpdate="2s ago" />
          </div>
          
          <div className="flex items-center gap-2">
            <ControlPanel 
              onPlayPause={setIsRunning}
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
                price={1.08734} 
                change={0.00123} 
                changePercent={0.11} 
              />
              
              <SignalIndicator 
                direction="UP" 
                probability={0.73} 
                timestamp="2s ago"
              />
            </div>

            <PerformanceMetrics 
              successRate={0.673}
              precision={0.71}
              recall={0.68}
              totalSignals={1247}
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <TradingChart height="500px" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                title="Accuracy" 
                value="67.3%" 
                subtitle="Last 24 hours"
                icon={Activity}
                trend={{ value: 2.4, isPositive: true }}
              />
              <MetricCard 
                title="Total Signals" 
                value="1,247" 
                subtitle="This session"
                icon={Target}
                trend={{ value: -0.8, isPositive: false }}
              />
              <MetricCard 
                title="Avg Confidence" 
                value="71.2%" 
                subtitle="Current model"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <SignalHistory signals={mockSignals} maxHeight="calc(100vh - 200px)" />
          </div>
        </div>
      </main>
    </div>
  );
}
