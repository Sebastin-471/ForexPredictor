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
   - Returns (1m, 2m, 5m, 10m)
   - Moving averages (SMA, EMA with periods 3, 5, 13)
   - RSI (14-period)
   - ATR (14-period)
   - Candle body/wick ratios
   - Time-based features (hour, minute, day of week)

4. **ML Model** (`server/mlModel.ts`): Simple logistic regression-like model with sigmoid activation. Implements online learning - updates weights after each prediction result using gradient descent. Maintains rolling buffer of recent training examples (500 max).

5. **Prediction Engine** (`server/predictionEngine.ts`): Orchestrates the prediction pipeline:
   - Triggers every minute to generate new prediction
   - Fetches recent candles, calculates features, runs ML inference
   - Stores pending predictions and validates them against actual outcomes
   - Triggers model retraining every 50 predictions
   - Emits signals via WebSocket to frontend

**Data Flow**:
```
TickSimulator → CandleAggregator → FeatureEngine → MLModel → PredictionEngine → WebSocket → Frontend
                                                                      ↓
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

**Model Type**: Online learning logistic regression with sigmoid activation. Simple but effective for binary classification (UP/DOWN).

**Training Strategy**:
- **Initial State**: Random small weights initialization
- **Online Learning**: After each minute, actual price movement validates the prediction, and the model updates weights via gradient descent
- **Batch Retraining**: Every 50 predictions triggers more intensive weight updates
- **Feature Scaling**: Implicit normalization through returns-based features

**Performance Tracking**: 
- Dynamic success rate using time-weighted accuracy
- Precision and recall for imbalanced class detection
- Rolling window metrics (last N signals)

**Auto-Learning Mechanism**: Continuously improves by learning from prediction errors. Maintains buffer of recent examples to avoid catastrophic forgetting while adapting to market regime changes.

**Rationale**: A lightweight model enables real-time inference and training without GPU requirements. The online learning approach allows the system to adapt to changing market conditions without manual retraining cycles.

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