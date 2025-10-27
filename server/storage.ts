import { type User, type InsertUser, type Tick, type InsertTick, type Candle, type InsertCandle, type Signal, type InsertSignal, type ModelMetric, type InsertModelMetric } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Ticks
  createTick(tick: InsertTick): Promise<Tick>;
  getRecentTicks(limit: number): Promise<Tick[]>;
  
  // Candles
  createCandle(candle: InsertCandle): Promise<Candle>;
  getRecentCandles(limit: number): Promise<Candle[]>;
  getLatestCandle(): Promise<Candle | undefined>;
  
  // Signals
  createSignal(signal: InsertSignal): Promise<Signal>;
  getRecentSignals(limit: number): Promise<Signal[]>;
  updateSignalResult(id: string, actualDirection: string, isCorrect: boolean, priceAfterMinute: number): Promise<void>;
  getSignalsForMetrics(windowSize: number): Promise<Signal[]>;
  
  // Model Metrics
  createModelMetric(metric: InsertModelMetric): Promise<ModelMetric>;
  getLatestMetric(): Promise<ModelMetric | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private ticks: Tick[];
  private candles: Candle[];
  private signals: Signal[];
  private modelMetrics: ModelMetric[];

  constructor() {
    this.users = new Map();
    this.ticks = [];
    this.candles = [];
    this.signals = [];
    this.modelMetrics = [];
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Ticks
  async createTick(insertTick: InsertTick): Promise<Tick> {
    const tick: Tick = {
      id: randomUUID(),
      timestamp: new Date(),
      ...insertTick,
    };
    this.ticks.push(tick);
    // Keep only last 10000 ticks in memory
    if (this.ticks.length > 10000) {
      this.ticks = this.ticks.slice(-10000);
    }
    return tick;
  }

  async getRecentTicks(limit: number): Promise<Tick[]> {
    return this.ticks.slice(-limit).reverse();
  }

  // Candles
  async createCandle(insertCandle: InsertCandle): Promise<Candle> {
    const candle: Candle = {
      id: randomUUID(),
      ...insertCandle,
    };
    this.candles.push(candle);
    // Keep only last 1440 candles (24 hours at 1min intervals)
    if (this.candles.length > 1440) {
      this.candles = this.candles.slice(-1440);
    }
    return candle;
  }

  async getRecentCandles(limit: number): Promise<Candle[]> {
    return this.candles.slice(-limit).reverse();
  }

  async getLatestCandle(): Promise<Candle | undefined> {
    return this.candles[this.candles.length - 1];
  }

  // Signals
  async createSignal(insertSignal: InsertSignal): Promise<Signal> {
    const signal: Signal = {
      id: randomUUID(),
      timestamp: new Date(),
      ...insertSignal,
    };
    this.signals.push(signal);
    // Keep only last 1000 signals
    if (this.signals.length > 1000) {
      this.signals = this.signals.slice(-1000);
    }
    return signal;
  }

  async getRecentSignals(limit: number): Promise<Signal[]> {
    return this.signals.slice(-limit).reverse();
  }

  async updateSignalResult(id: string, actualDirection: string, isCorrect: boolean, priceAfterMinute: number): Promise<void> {
    const signal = this.signals.find(s => s.id === id);
    if (signal) {
      signal.actualDirection = actualDirection;
      signal.isCorrect = isCorrect;
      signal.priceAfterMinute = priceAfterMinute;
    }
  }

  async getSignalsForMetrics(windowSize: number): Promise<Signal[]> {
    return this.signals
      .filter(s => s.isCorrect !== null && s.isCorrect !== undefined)
      .slice(-windowSize);
  }

  // Model Metrics
  async createModelMetric(insertMetric: InsertModelMetric): Promise<ModelMetric> {
    const metric: ModelMetric = {
      id: randomUUID(),
      timestamp: new Date(),
      ...insertMetric,
    };
    this.modelMetrics.push(metric);
    // Keep only last 100 metrics
    if (this.modelMetrics.length > 100) {
      this.modelMetrics = this.modelMetrics.slice(-100);
    }
    return metric;
  }

  async getLatestMetric(): Promise<ModelMetric | undefined> {
    return this.modelMetrics[this.modelMetrics.length - 1];
  }
}

export const storage = new MemStorage();
