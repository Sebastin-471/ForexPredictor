import { storage } from "./storage";
import { featureEngine } from "./featureEngine";
import { tfModel } from "./tfModel";
import { replayBuffer } from "./replayBuffer";
import { type Signal } from "@shared/schema";
import { EventEmitter } from "events";

export class PredictionEngine extends EventEmitter {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private checkIntervalId: NodeJS.Timeout | null = null;
  private trainingIntervalId: NodeJS.Timeout | null = null;
  private pendingSignals: Map<string, { timestamp: Date; price: number; bufferSampleId: string }> = new Map();
  private readonly trainingInterval = 10000; // Train every 10 seconds
  private readonly batchSize = 64;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("[PredictionEngine] Starting prediction engine with TensorFlow.js...");
    
    // Generate predictions every minute
    this.intervalId = setInterval(async () => {
      await this.generatePrediction();
    }, 60000); // Every 60 seconds
    
    // Check for completed predictions
    this.checkIntervalId = setInterval(async () => {
      await this.checkCompletedPredictions();
    }, 5000); // Every 5 seconds
    
    // Background training loop
    this.trainingIntervalId = setInterval(async () => {
      await this.trainModelOnBatch();
    }, this.trainingInterval);
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    if (this.trainingIntervalId) {
      clearInterval(this.trainingIntervalId);
      this.trainingIntervalId = null;
    }
    console.log("[PredictionEngine] Stopped prediction engine.");
  }

  private async generatePrediction() {
    try {
      // Get recent candles for feature calculation
      const candles = await storage.getRecentCandles(100);
      
      if (candles.length < 20) {
        console.log("[PredictionEngine] Not enough candles for prediction");
        return;
      }
      
      // Calculate features
      const features = featureEngine.calculateFeatures(candles.reverse());
      
      if (!features) {
        console.log("[PredictionEngine] Could not calculate features");
        return;
      }
      
      // Convert to array
      const featureArray = featureEngine.featuresToArray(features);
      
      // Make prediction with TensorFlow model
      const prediction = await tfModel.predict(featureArray);
      
      // Get current price
      const latestCandle = candles[candles.length - 1];
      const currentPrice = latestCandle.close;
      
      // Store signal
      const signal = await storage.createSignal({
        direction: prediction.direction,
        probability: prediction.confidence,
        modelVersion: tfModel.getModelVersion(),
        features: JSON.stringify(features),
        priceAtPrediction: currentPrice,
      });
      
      // Add pending sample to replay buffer (label will be set later)
      const bufferSampleId = signal.id; // Use signal ID as buffer sample ID
      replayBuffer.add({
        id: bufferSampleId,
        features: featureArray,
        label: null,
        createdAt: Date.now(),
      });
      
      // Track pending signal for later verification
      this.pendingSignals.set(signal.id, {
        timestamp: signal.timestamp,
        price: currentPrice,
        bufferSampleId,
      });
      
      console.log(`[PredictionEngine] Generated ${prediction.direction} signal with ${(prediction.confidence * 100).toFixed(1)}% confidence at price ${currentPrice.toFixed(5)}`);
      
      this.emit("signal", signal);
      
    } catch (error) {
      console.error("[PredictionEngine] Error generating prediction:", error);
    }
  }

  private async checkCompletedPredictions() {
    const now = new Date();
    const completedIds: string[] = [];
    
    for (const [signalId, signalInfo] of Array.from(this.pendingSignals.entries())) {
      // Check if 1 minute has passed
      const elapsed = now.getTime() - signalInfo.timestamp.getTime();
      
      if (elapsed >= 60000) { // 60 seconds
        await this.verifyPrediction(signalId, signalInfo.price, signalInfo.bufferSampleId);
        completedIds.push(signalId);
      }
    }
    
    // Remove completed signals
    completedIds.forEach(id => this.pendingSignals.delete(id));
  }

  private async verifyPrediction(signalId: string, predictedPrice: number, bufferSampleId: string) {
    try {
      // Get current price (from latest candle)
      const latestCandle = await storage.getLatestCandle();
      
      if (!latestCandle) return;
      
      const currentPrice = latestCandle.close;
      const priceChange = currentPrice - predictedPrice;
      const actualDirection = priceChange >= 0 ? "UP" : "DOWN";
      
      // Get the signal to check if prediction was correct
      const signals = await storage.getRecentSignals(100);
      const signal = signals.find(s => s.id === signalId);
      
      if (!signal) return;
      
      const isCorrect = signal.direction === actualDirection;
      
      // Update signal with result
      await storage.updateSignalResult(signalId, actualDirection, isCorrect, currentPrice);
      
      console.log(`[PredictionEngine] Verified signal ${signalId}: Predicted ${signal.direction}, Actual ${actualDirection}, ${isCorrect ? "✓ CORRECT" : "✗ INCORRECT"}`);
      
      // Label the corresponding replay buffer sample
      const bufferSample = replayBuffer.findById(bufferSampleId);
      if (bufferSample && bufferSample.label === null) {
        bufferSample.label = actualDirection === "UP" ? 1 : 0;
        console.log(`[PredictionEngine] Labeled training sample ${bufferSampleId}: ${actualDirection} (${bufferSample.label})`);
      }
      
      // Update metrics
      await this.updateMetrics();
      
    } catch (error) {
      console.error("[PredictionEngine] Error verifying prediction:", error);
    }
  }

  private async trainModelOnBatch() {
    try {
      const labeledCount = replayBuffer.getLabeledCount();
      
      if (labeledCount < 32) {
        return; // Not enough labeled data
      }
      
      // Sample batch from replay buffer
      const batch = replayBuffer.sampleWithLabels(this.batchSize);
      
      if (batch.length < 16) {
        return;
      }
      
      const features = batch.map(sample => sample.features);
      const labels = batch.map(sample => sample.label as number);
      
      await tfModel.trainOnBatch(features, labels);
      
    } catch (error) {
      console.error("[PredictionEngine] Error in training loop:", error);
    }
  }

  private async updateMetrics() {
    try {
      const signals = await storage.getSignalsForMetrics(100);
      
      if (signals.length === 0) return;
      
      const correctSignals = signals.filter(s => s.isCorrect === true).length;
      const totalSignals = signals.length;
      const accuracy = correctSignals / totalSignals;
      
      // Calculate precision and recall for UP signals
      const upSignals = signals.filter(s => s.direction === "UP");
      const correctUpSignals = upSignals.filter(s => s.isCorrect === true).length;
      const actualUpSignals = signals.filter(s => s.actualDirection === "UP").length;
      
      const precision = upSignals.length > 0 ? correctUpSignals / upSignals.length : 0;
      const recall = actualUpSignals > 0 ? correctUpSignals / actualUpSignals : 0;
      
      const metric = await storage.createModelMetric({
        modelVersion: tfModel.getModelVersion(),
        accuracy,
        precision,
        recall,
        totalSignals,
        correctSignals,
        windowSize: 100,
      });
      
      this.emit("metrics", metric);
      
    } catch (error) {
      console.error("[PredictionEngine] Error updating metrics:", error);
    }
  }

  async getLatestPrediction(): Promise<Signal | undefined> {
    const signals = await storage.getRecentSignals(1);
    return signals[0];
  }

  async getDynamicSuccessRate(windowSize: number = 100, decayFactor: number = 0.01): Promise<number> {
    const signals = await storage.getSignalsForMetrics(windowSize);
    
    if (signals.length === 0) return 0;
    
    const now = Date.now();
    let weightedCorrect = 0;
    let totalWeight = 0;
    
    for (const signal of signals) {
      const age = (now - signal.timestamp.getTime()) / 1000; // Age in seconds
      const weight = Math.exp(-decayFactor * age / 3600); // Decay per hour
      
      weightedCorrect += (signal.isCorrect ? 1 : 0) * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? weightedCorrect / totalWeight : 0;
  }
}

export const predictionEngine = new PredictionEngine();
