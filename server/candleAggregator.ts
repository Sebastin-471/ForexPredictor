import { storage } from "./storage";
import { EventEmitter } from "events";
import { type Candle, type Tick } from "@shared/schema";

export class CandleAggregator extends EventEmitter {
  private currentCandle: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    startTime: Date;
  } | null = null;
  
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("[CandleAggregator] Starting candle aggregation...");
    
    // Check every second if we need to close the current candle
    this.intervalId = setInterval(async () => {
      await this.checkAndCloseCandle();
    }, 1000);
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log("[CandleAggregator] Stopped candle aggregation.");
  }

  async processTick(price: number) {
    if (!this.currentCandle) {
      // Start new candle
      const now = new Date();
      now.setSeconds(0, 0); // Round to the start of the minute
      
      this.currentCandle = {
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 1,
        startTime: now,
      };
    } else {
      // Update current candle
      this.currentCandle.high = Math.max(this.currentCandle.high, price);
      this.currentCandle.low = Math.min(this.currentCandle.low, price);
      this.currentCandle.close = price;
      this.currentCandle.volume += 1;
    }
    
    this.emit("candle_update", this.currentCandle);
  }

  private async checkAndCloseCandle() {
    if (!this.currentCandle) return;
    
    const now = new Date();
    const currentMinute = new Date(now);
    currentMinute.setSeconds(0, 0);
    
    // If we've moved to a new minute, close the current candle
    if (currentMinute.getTime() > this.currentCandle.startTime.getTime()) {
      await this.closeCandle();
    }
  }

  private async closeCandle() {
    if (!this.currentCandle) return;
    
    try {
      const candle = await storage.createCandle({
        timestamp: this.currentCandle.startTime,
        open: this.currentCandle.open,
        high: this.currentCandle.high,
        low: this.currentCandle.low,
        close: this.currentCandle.close,
        volume: this.currentCandle.volume,
      });
      
      console.log(`[CandleAggregator] Closed candle at ${this.currentCandle.startTime.toISOString()}: O=${this.currentCandle.open.toFixed(5)} H=${this.currentCandle.high.toFixed(5)} L=${this.currentCandle.low.toFixed(5)} C=${this.currentCandle.close.toFixed(5)}`);
      
      this.emit("candle_closed", candle);
    } catch (error) {
      console.error("[CandleAggregator] Error creating candle:", error);
    }
    
    // Reset for next candle
    this.currentCandle = null;
  }

  getCurrentCandle() {
    return this.currentCandle;
  }
}

export const candleAggregator = new CandleAggregator();
