import { storage } from "./storage";
import { EventEmitter } from "events";
import { type Tick } from "@shared/schema";

export class TickSimulator extends EventEmitter {
  private basePrice = 1.08500;
  private volatility = 0.0001;
  private trend = 0.00001;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("[TickSimulator] Starting tick generation...");
    
    // Generate ticks every 100ms (10 ticks per second)
    this.intervalId = setInterval(async () => {
      await this.generateTick();
    }, 100);
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log("[TickSimulator] Stopped tick generation.");
  }

  private async generateTick() {
    // Generate realistic EUR/USD price movement
    const randomChange = (Math.random() - 0.5) * this.volatility;
    const trendChange = this.trend * (Math.random() - 0.3);
    
    this.basePrice += randomChange + trendChange;
    
    // Ensure price stays in realistic range (1.05 - 1.12)
    this.basePrice = Math.max(1.05, Math.min(1.12, this.basePrice));
    
    const spread = 0.00005; // 0.5 pips spread
    const bid = this.basePrice - spread / 2;
    const ask = this.basePrice + spread / 2;
    const mid = (bid + ask) / 2;
    
    try {
      const tick = await storage.createTick({
        bid,
        ask,
        mid,
      });
      
      this.emit("tick", tick);
    } catch (error) {
      console.error("[TickSimulator] Error creating tick:", error);
    }
  }

  getCurrentPrice(): number {
    return this.basePrice;
  }

  setTrend(trend: number) {
    this.trend = trend;
  }
}

export const tickSimulator = new TickSimulator();
