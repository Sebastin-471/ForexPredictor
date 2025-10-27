import { type TechnicalFeatures } from "./featureEngine";

// Simple ML model using logistic regression-like approach
// In a production system, this would interface with Python/scikit-learn
export interface PredictionResult {
  direction: "UP" | "DOWN";
  probability: number;
}

export class MLModel {
  private modelVersion = "v1.0.0-baseline";
  private weights: number[];
  private bias: number;
  private trainingData: Array<{ features: number[]; label: number }> = [];
  private learningRate = 0.01;
  private readonly maxTrainingData = 500;

  constructor() {
    // Initialize with small random weights
    this.weights = Array(18).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bias = 0;
    
    console.log("[MLModel] Initialized with random weights");
  }

  predict(features: number[]): PredictionResult {
    // Calculate weighted sum
    let sum = this.bias;
    for (let i = 0; i < features.length; i++) {
      sum += features[i] * this.weights[i];
    }
    
    // Apply sigmoid activation
    const probability = this.sigmoid(sum);
    
    // Determine direction based on probability
    const direction = probability >= 0.5 ? "UP" : "DOWN";
    
    return {
      direction,
      probability: direction === "UP" ? probability : 1 - probability,
    };
  }

  addTrainingExample(features: number[], actualDirection: "UP" | "DOWN") {
    const label = actualDirection === "UP" ? 1 : 0;
    
    this.trainingData.push({ features, label });
    
    // Keep only recent data
    if (this.trainingData.length > this.maxTrainingData) {
      this.trainingData = this.trainingData.slice(-this.maxTrainingData);
    }
  }

  train() {
    if (this.trainingData.length < 20) {
      console.log("[MLModel] Not enough training data, skipping training");
      return;
    }
    
    console.log(`[MLModel] Training model with ${this.trainingData.length} examples...`);
    
    // Perform gradient descent for a few iterations
    const iterations = 10;
    
    for (let iter = 0; iter < iterations; iter++) {
      let totalLoss = 0;
      
      // Shuffle training data
      const shuffled = [...this.trainingData].sort(() => Math.random() - 0.5);
      
      for (const example of shuffled) {
        const { features, label } = example;
        
        // Forward pass
        let sum = this.bias;
        for (let i = 0; i < features.length; i++) {
          sum += features[i] * this.weights[i];
        }
        const prediction = this.sigmoid(sum);
        
        // Calculate error
        const error = prediction - label;
        totalLoss += error * error;
        
        // Backward pass - update weights
        const gradient = error * prediction * (1 - prediction);
        
        for (let i = 0; i < features.length; i++) {
          this.weights[i] -= this.learningRate * gradient * features[i];
        }
        this.bias -= this.learningRate * gradient;
      }
      
      const avgLoss = totalLoss / shuffled.length;
      if (iter === iterations - 1) {
        console.log(`[MLModel] Training complete. Final loss: ${avgLoss.toFixed(6)}`);
      }
    }
    
    // Increment model version
    const versionParts = this.modelVersion.split("-")[0].split(".");
    versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
    this.modelVersion = versionParts.join(".") + "-retrained";
    
    console.log(`[MLModel] Model updated to version ${this.modelVersion}`);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  getModelVersion(): string {
    return this.modelVersion;
  }

  getTrainingDataSize(): number {
    return this.trainingData.length;
  }
}

export const mlModel = new MLModel();
