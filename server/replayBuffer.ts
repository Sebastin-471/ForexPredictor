export interface TrainingExample {
  features: number[];
  label: number | null; // 1 = UP, 0 = DOWN, null = pending
  createdAt: number;
}

export class ReplayBuffer {
  private buffer: TrainingExample[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  add(example: TrainingExample): void {
    this.buffer.push(example);
    
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  size(): number {
    return this.buffer.length;
  }

  peekLast(): TrainingExample | null {
    if (this.buffer.length === 0) return null;
    return this.buffer[this.buffer.length - 1];
  }

  sampleWithLabels(n: number): TrainingExample[] {
    const labeled = this.buffer.filter(
      (example) => example.label === 0 || example.label === 1
    );

    if (labeled.length === 0) return [];

    const sampled: TrainingExample[] = [];
    const sampleSize = Math.min(n, labeled.length);

    for (let i = 0; i < sampleSize; i++) {
      const idx = Math.floor(Math.random() * labeled.length);
      sampled.push(labeled[idx]);
    }

    return sampled;
  }

  getLabeledCount(): number {
    return this.buffer.filter(
      (example) => example.label === 0 || example.label === 1
    ).length;
  }

  clear(): void {
    this.buffer = [];
  }
}

export const replayBuffer = new ReplayBuffer(50000);
