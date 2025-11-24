# Real-Time Trading Prediction System

## Overview

This is a real-time EUR/USD trading prediction system that uses machine learning to forecast price direction (UP/DOWN) for the next minute. The application provides live price feeds, generates predictions with confidence scores, tracks model performance metrics, and features an auto-learning mechanism that continuously improves based on actual market outcomes.

The system is built as a full-stack web application with real-time WebSocket communication, displaying predictions on an interactive dashboard with candlestick charts and performance analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Components**: Built with shadcn/ui (Radix UI primitives) styled with Tailwind CSS. The design follows Carbon Design System patterns optimized for financial/trading applications with emphasis on data clarity and glanceable metrics.

**State Management**: TanStack Query (React Query) for server state management, with local React state for real-time updates.

**Real-Time Communication**: Custom WebSocket client (`client/src/lib/websocket.ts`) that handles bi-directional communication for live tick data, candle updates, trading signals, and performance metrics.

**Design System**: Dark mode primary theme with semantic color coding for trading signals (green for bullish/UP, red for bearish/DOWN). Typography uses Inter for UI and JetBrains Mono for numerical data to ensure readability of financial information.

**Key Components**:
- `Dashboard`: Main view orchestrating all real-time data displays
- `TradingChart`: Placeholder for candlestick visualization with prediction overlays
- `SignalIndicator`: Visual display of current prediction with confidence level
- `PerformanceMetrics`: Circular progress showing success rate and model metrics
- `SignalHistory`: Scrollable list of past predictions with results

### Backend Architecture

**Framework**: Express.js with TypeScript, running on Node.js.

**Architecture Pattern**: Event-driven microservices pattern with several specialized engines:

1. **Tick Simulator** (`server/tickSimulator.ts`): Generates realistic EUR/USD price movements (simulates market data feed at 10 ticks/second). Uses random walk with drift to create realistic price action within 1.05-1.12 range.

2. **Candle Aggregator** (`server/candleAggregator.ts`): Consumes tick data and aggregates into 1-minute OHLCV candles. Emits events when candles close to trigger prediction generation.

3. **Feature Engine** (`server/featureEngine.ts`): Calculates technical indicators from candle data including:
   - Returns (1m, 2m, 5m, 10m) - normalized and clamped
   - Moving averages (SMA, EMA with periods 3, 5, 13) - normalized relative to current price
   - RSI (14-period) - normalized to [-1, 1]
   - ATR (14-period) - normalized relative to price
   - Candle body/wick ratios
   - Time-based features (hour, minute, day of week)
   - All features are normalized to improve neural network training

4. **Replay Buffer** (`server/replayBuffer.ts`): Experience replay system for training stability:
   - Stores up to 50,000 training examples (features + labels)
   - Supports random sampling for batch training
   - Labels are set when actual price movement is known (after 1 minute)

5. **TensorFlow.js Model** (`server/tfModel.ts`): Deep neural network with 3 hidden layers:
   - Architecture: 18 inputs → 64 neurons (ReLU + Dropout 30%) → 32 neurons (ReLU + Dropout 20%) → 16 neurons (ReLU) → 1 output (Sigmoid)
   - Total: 3,841 trainable parameters
   - L2 regularization to prevent overfitting
   - Adam optimizer with learning rate 0.001
   - Binary cross-entropy loss for UP/DOWN classification

6. **Prediction Engine** (`server/predictionEngine.ts`): Orchestrates the prediction and training pipeline:
   - Generates predictions every minute using TensorFlow model
   - Stores predictions in replay buffer with null labels (pending)
   - Validates predictions after 1 minute and labels training samples
   - Background training loop every 10 seconds with batch size 64
   - Continuous online learning from market outcomes
   - Emits signals and metrics via WebSocket to frontend

**Data Flow**:
```
TickSimulator → CandleAggregator → FeatureEngine → TFModel → PredictionEngine → WebSocket → Frontend
                                                                      ↓              ↑
                                                               ReplayBuffer ←────────┘
                                                                      ↓         (training)
                                                              Storage (in-memory/DB)
```

### Data Storage Solutions

**Current Implementation**: In-memory storage (`server/storage.ts`) with interface-based design (`IStorage`) that provides abstraction for future database implementation.

**Schema Design** (`shared/schema.ts`): Drizzle ORM schema definitions for PostgreSQL:
- `users`: User authentication (username, password)
- `ticks`: Raw price data (timestamp, pair, bid, ask, mid)
- `candles`: 1-minute OHLCV aggregated data
- `signals`: ML predictions with results (timestamp, direction, probability, actual outcome, correctness)
- `modelMetrics`: Performance tracking (accuracy, precision, recall, success rate)

**Database Configuration**: PostgreSQL via Neon serverless driver with WebSocket support. Drizzle Kit configured for migrations with schema in `shared/schema.ts`.

**Rationale**: The in-memory implementation allows for rapid development and testing. The interface-based design ensures easy migration to PostgreSQL without changing business logic. All entities include proper timestamps and relationships for time-series analysis.

### Authentication and Authorization

**Current State**: Basic user schema defined but authentication not implemented in routes. The system is designed for single-user or demo usage currently.

**Planned Approach**: Username/password authentication with session management (connect-pg-simple for PostgreSQL session store is included in dependencies).

### Real-Time Communication

**Protocol**: WebSocket over HTTP/HTTPS with automatic reconnection logic.

**Message Types**:
- `tick`: Individual price updates (10/second)
- `candle_update`: Completed 1-minute candles
- `signal`: New prediction with direction and confidence
- `metrics`: Updated model performance statistics
- `initial_state`: Snapshot on connection (recent data for hydration)
- `connection`: Connection status updates

**Connection Management**: Client-side WebSocket wrapper with automatic reconnection, event emitter pattern for subscriptions, and graceful degradation on connection loss.

### Machine Learning Strategy

**Model Type**: Deep neural network using TensorFlow.js (`@tensorflow/tfjs-node`) for enhanced prediction accuracy.

**Architecture**:
- **Input Layer**: 18 normalized features (price returns, technical indicators, time features)
- **Hidden Layer 1**: 64 neurons with ReLU activation + 30% dropout (He initialization, L2 regularization)
- **Hidden Layer 2**: 32 neurons with ReLU activation + 20% dropout (He initialization, L2 regularization)
- **Hidden Layer 3**: 16 neurons with ReLU activation (He initialization)
- **Output Layer**: 1 neuron with sigmoid activation (binary classification: UP/DOWN)
- **Total Parameters**: 3,841 trainable parameters

**Training Strategy**:
- **Initial State**: Random weight initialization using He Normal and Glorot Normal
- **Experience Replay**: Stores up to 50,000 training examples in replay buffer
- **Online Learning**: After each prediction, actual price movement labels the training sample
- **Batch Training**: Every 10 seconds, samples 64 random examples from buffer and trains for 5 epochs
- **Optimizer**: Adam with learning rate 0.001
- **Loss Function**: Binary cross-entropy
- **Feature Normalization**: All features scaled to [-1, 1] or [0, 1] for optimal neural network training

**Performance Tracking**: 
- Real-time accuracy and loss metrics during training
- Dynamic success rate using time-weighted accuracy
- Precision and recall for imbalanced class detection
- Rolling window metrics (last 100 signals)
- Model version tracking for each prediction

**Auto-Learning Mechanism**: Continuously improves through experience replay and batch training. The replay buffer prevents catastrophic forgetting by maintaining a diverse set of historical examples. The model adapts to changing market conditions while retaining knowledge from past patterns.

**Rationale**: Deep learning provides superior pattern recognition compared to simple logistic regression. The 3-layer architecture can learn complex non-linear relationships in price movements. TensorFlow.js enables efficient CPU-based training without requiring GPU infrastructure. Experience replay ensures stable training and prevents overfitting to recent data.

## External Dependencies

### Third-Party Services

**Neon Database**: Serverless PostgreSQL hosting with WebSocket support for low-latency connections. Configured via `DATABASE_URL` environment variable.

**Market Data**: Currently using simulated data. Production system would integrate with forex data providers (e.g., Alpha Vantage, IEX Cloud, or broker APIs like OANDA, Interactive Brokers).

### Key Libraries

**Frontend**:
- `@tanstack/react-query`: Server state management and caching
- `@radix-ui/*`: Headless UI components (accordion, dialog, dropdown, etc.)
- `wouter`: Lightweight routing
- `date-fns`: Date manipulation
- `lucide-react`: Icon system

**Backend**:
- `drizzle-orm`: Type-safe ORM with PostgreSQL support
- `@neondatabase/serverless`: Neon-optimized PostgreSQL client
- `ws`: WebSocket server implementation
- `express`: HTTP server framework
- `zod`: Runtime type validation via drizzle-zod

**Development**:
- `vite`: Build tool and dev server with HMR
- `typescript`: Type safety across full stack
- `tailwindcss`: Utility-first CSS framework
- `tsx`: TypeScript execution for Node.js

### Integration Points

**Database Connection**: Via Drizzle ORM connecting to Neon PostgreSQL using WebSocket protocol (configured in `server/db.ts`).

**Build Pipeline**: Vite for frontend SPA build, esbuild for backend bundling (both configured to output to `dist/` directory).

**Development Workflow**: Single `npm run dev` command starts both frontend (Vite dev server) and backend (tsx watch mode) with HMR for rapid iteration.