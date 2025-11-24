import * as tf from '@tensorflow/tfjs-node';

export interface PredictionResult {
  direction: "UP" | "DOWN";
  probability: number;
  confidence: number;
}

export class TFModel {
  private model: tf.Sequential | null = null;
  private modelVersion = "v2.0.0-tensorflow";
  private inputSize: number;
  private isTraining = false;
  
  constructor(inputSize: number = 18) {
    this.inputSize = inputSize;
    this.initializeModel();
  }

  private initializeModel(): void {
    this.model = tf.sequential({
      layers: [
        // First hidden layer with more neurons
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          inputShape: [this.inputSize],
          kernelInitializer: 'heNormal',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dropout({ rate: 0.3 }),
        
        // Second hidden layer
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelInitializer: 'heNormal',
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
        }),
        tf.layers.dropout({ rate: 0.2 }),
        
        // Third hidden layer
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          kernelInitializer: 'heNormal'
        }),
        
        // Output layer (binary classification)
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid',
          kernelInitializer: 'glorotNormal'
        })
      ]
    });

    // Compile with Adam optimizer
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    console.log("[TFModel] Initialized deep neural network");
    this.model.summary();
  }

  async predict(features: number[]): Promise<PredictionResult> {
    if (!this.model) {
      throw new Error("Model not initialized");
    }

    return tf.tidy(() => {
      const input = tf.tensor2d([features], [1, this.inputSize]);
      const prediction = this.model!.predict(input) as tf.Tensor;
      const probability = prediction.dataSync()[0];
      
      const direction: "UP" | "DOWN" = probability >= 0.5 ? "UP" : "DOWN";
      const confidence = direction === "UP" 
        ? probability 
        : 1 - probability;

      return {
        direction,
        probability,
        confidence
      };
    });
  }

  async predictRaw(features: number[]): Promise<number> {
    if (!this.model) {
      throw new Error("Model not initialized");
    }

    return tf.tidy(() => {
      const input = tf.tensor2d([features], [1, this.inputSize]);
      const prediction = this.model!.predict(input) as tf.Tensor;
      return prediction.dataSync()[0];
    });
  }

  async trainOnBatch(
    featuresArray: number[][],
    labels: number[]
  ): Promise<void> {
    if (!this.model || this.isTraining) {
      return;
    }

    if (featuresArray.length < 16) {
      console.log("[TFModel] Not enough samples for training batch");
      return;
    }

    this.isTraining = true;

    try {
      const xs = tf.tensor2d(featuresArray, [featuresArray.length, this.inputSize]);
      const ys = tf.tensor2d(labels.map(l => [l]), [labels.length, 1]);

      const history = await this.model.fit(xs, ys, {
        epochs: 5,
        batchSize: Math.min(32, featuresArray.length),
        shuffle: true,
        verbose: 0
      });

      const loss = history.history.loss[history.history.loss.length - 1];
      const acc = history.history.acc ? history.history.acc[history.history.acc.length - 1] : 0;
      
      console.log(
        `[TFModel] Trained on ${featuresArray.length} samples - ` +
        `Loss: ${(loss as number).toFixed(4)}, Acc: ${(acc as number).toFixed(4)}`
      );

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      // Update version
      const versionNum = parseInt(this.modelVersion.split('.')[2].split('-')[0]);
      this.modelVersion = `v2.0.${versionNum + 1}-tensorflow`;

    } catch (error) {
      console.error("[TFModel] Training error:", error);
    } finally {
      this.isTraining = false;
    }
  }

  getModelVersion(): string {
    return this.modelVersion;
  }

  async dispose(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

export const tfModel = new TFModel(18);
