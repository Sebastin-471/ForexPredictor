import { type Candle } from "@shared/schema";

export interface TechnicalFeatures {
  // Price features
  returns_1m: number;
  returns_2m: number;
  returns_5m: number;
  returns_10m: number;
  bodyRatio: number;
  upperWickRatio: number;
  lowerWickRatio: number;
  
  // Momentum indicators
  sma_3: number;
  sma_5: number;
  sma_13: number;
  ema_3: number;
  ema_5: number;
  ema_13: number;
  rsi_14: number;
  
  // Volatility
  atr_14: number;
  
  // Time features
  hour: number;
  minute: number;
  dayOfWeek: number;
}

export class FeatureEngine {
  calculateFeatures(candles: Candle[]): TechnicalFeatures | null {
    if (candles.length < 20) {
      return null; // Not enough data
    }
    
    const latest = candles[candles.length - 1];
    const prices = candles.map(c => c.close);
    
    return {
      // Returns (log returns)
      returns_1m: this.calculateReturn(prices, 1),
      returns_2m: this.calculateReturn(prices, 2),
      returns_5m: this.calculateReturn(prices, 5),
      returns_10m: this.calculateReturn(prices, 10),
      
      // Candle body/wick ratios
      bodyRatio: this.calculateBodyRatio(latest),
      upperWickRatio: this.calculateUpperWickRatio(latest),
      lowerWickRatio: this.calculateLowerWickRatio(latest),
      
      // Moving averages
      sma_3: this.calculateSMA(prices, 3),
      sma_5: this.calculateSMA(prices, 5),
      sma_13: this.calculateSMA(prices, 13),
      ema_3: this.calculateEMA(prices, 3),
      ema_5: this.calculateEMA(prices, 5),
      ema_13: this.calculateEMA(prices, 13),
      
      // RSI
      rsi_14: this.calculateRSI(prices, 14),
      
      // ATR
      atr_14: this.calculateATR(candles, 14),
      
      // Time features
      hour: latest.timestamp.getHours(),
      minute: latest.timestamp.getMinutes(),
      dayOfWeek: latest.timestamp.getDay(),
    };
  }

  private calculateReturn(prices: number[], period: number): number {
    if (prices.length < period + 1) return 0;
    const current = prices[prices.length - 1];
    const previous = prices[prices.length - 1 - period];
    return Math.log(current / previous);
  }

  private calculateBodyRatio(candle: Candle): number {
    const range = candle.high - candle.low;
    if (range === 0) return 0;
    const body = Math.abs(candle.close - candle.open);
    return body / range;
  }

  private calculateUpperWickRatio(candle: Candle): number {
    const range = candle.high - candle.low;
    if (range === 0) return 0;
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    return upperWick / range;
  }

  private calculateLowerWickRatio(candle: Candle): number {
    const range = candle.high - candle.low;
    if (range === 0) return 0;
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    return lowerWick / range;
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    const slice = prices.slice(-period);
    return slice.reduce((sum, p) => sum + p, 0) / period;
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const recentChanges = changes.slice(-period);
    const gains = recentChanges.filter(c => c > 0);
    const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));
    
    const avgGain = gains.length > 0 ? gains.reduce((sum, g) => sum + g, 0) / period : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, l) => sum + l, 0) / period : 0;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateATR(candles: Candle[], period: number): number {
    if (candles.length < period + 1) return 0;
    
    const trueRanges = [];
    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }
    
    const recentTR = trueRanges.slice(-period);
    return recentTR.reduce((sum, tr) => sum + tr, 0) / period;
  }

  // Convert features to array for model input with normalization
  featuresToArray(features: TechnicalFeatures): number[] {
    const latest = features.sma_3; // Use as reference price
    
    return [
      // Returns are already normalized (log returns)
      this.clamp(features.returns_1m * 100, -5, 5) / 5, // Normalize to [-1, 1]
      this.clamp(features.returns_2m * 100, -5, 5) / 5,
      this.clamp(features.returns_5m * 100, -10, 10) / 10,
      this.clamp(features.returns_10m * 100, -15, 15) / 15,
      
      // Candle ratios are already [0,1]
      features.bodyRatio,
      features.upperWickRatio,
      features.lowerWickRatio,
      
      // Normalize moving averages relative to current price
      (features.sma_3 - latest) / latest,
      (features.sma_5 - latest) / latest,
      (features.sma_13 - latest) / latest,
      (features.ema_3 - latest) / latest,
      (features.ema_5 - latest) / latest,
      (features.ema_13 - latest) / latest,
      
      // RSI normalized to [-1, 1]
      (features.rsi_14 - 50) / 50,
      
      // ATR normalized relative to price
      features.atr_14 / latest,
      
      // Time features normalized
      features.hour / 24,
      features.minute / 60,
      features.dayOfWeek / 7,
    ];
  }
  
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

export const featureEngine = new FeatureEngine();
