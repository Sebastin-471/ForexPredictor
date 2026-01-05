import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { tickSimulator } from "./tickSimulator";
import { candleAggregator } from "./candleAggregator";
import { predictionEngine } from "./predictionEngine";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Store connected clients
  const clients = new Set<WebSocket>();

  // WebSocket connection handler
  wss.on("connection", (ws) => {
    console.log("[WebSocket] Client connected");
    clients.add(ws);

    ws.on("close", () => {
      console.log("[WebSocket] Client disconnected");
      clients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("[WebSocket] Error:", error);
      clients.delete(ws);
    });

    // Send initial state
    sendInitialState(ws);
  });

  // Broadcast function
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // REST API Routes
  
  // Get recent ticks
  app.get("/api/ticks", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const ticks = await storage.getRecentTicks(limit);
      res.json(ticks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ticks" });
    }
  });

  // Get recent candles
  app.get("/api/candles", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const candles = await storage.getRecentCandles(limit);
      res.json(candles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch candles" });
    }
  });

  // Get recent signals
  app.get("/api/signals", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const signals = await storage.getRecentSignals(limit);
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch signals" });
    }
  });

  // Get latest prediction
  app.get("/api/prediction/latest", async (req, res) => {
    try {
      const prediction = await predictionEngine.getLatestPrediction();
      res.json(prediction || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest prediction" });
    }
  });

  // Get metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const metric = await storage.getLatestMetric();
      const dynamicSuccessRate = await predictionEngine.getDynamicSuccessRate();
      
      res.json({
        ...metric,
        dynamicSuccessRate,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Control endpoint - start/stop simulation
  app.post("/api/control/start", (req, res) => {
    tickSimulator.start();
    candleAggregator.start();
    predictionEngine.start();
    res.json({ status: "started" });
  });

  app.post("/api/control/stop", (req, res) => {
    tickSimulator.stop();
    candleAggregator.stop();
    predictionEngine.stop();
    res.json({ status: "stopped" });
  });

  // Set up event-based real-time broadcasting (more efficient than polling)
  // Register listeners before starting services to avoid missing early events
  tickSimulator.on("tick", async (tick) => {
    try {
      // Process tick in candle aggregator
      await candleAggregator.processTick(tick.mid);
      
      // Broadcast tick to all clients
      broadcast({
        type: "tick",
        data: tick,
      });
    } catch (error) {
      console.error("[Broadcast Tick] Error:", error);
    }
  });

  // Throttle candle updates to once per second to reduce network traffic
  let lastCandleBroadcast = 0;
  const CANDLE_BROADCAST_THROTTLE = 1000; // 1 second

  candleAggregator.on("candle_update", (candle) => {
    const now = Date.now();
    if (now - lastCandleBroadcast >= CANDLE_BROADCAST_THROTTLE) {
      lastCandleBroadcast = now;
      broadcast({
        type: "candle_update",
        data: candle,
      });
    }
  });

  predictionEngine.on("signal", (signal) => {
    broadcast({
      type: "signal",
      data: signal,
    });
  });

  predictionEngine.on("metrics", async (metric) => {
    try {
      const dynamicSuccessRate = await predictionEngine.getDynamicSuccessRate();
      
      broadcast({
        type: "metrics",
        data: {
          ...metric,
          dynamicSuccessRate,
        },
      });
    } catch (error) {
      console.error("[Broadcast Metrics] Error:", error);
    }
  });

  // Start the services after event listeners are registered
  tickSimulator.start();
  candleAggregator.start();
  predictionEngine.start();

  async function sendInitialState(ws: WebSocket) {
    try {
      const ticks = await storage.getRecentTicks(10);
      const candles = await storage.getRecentCandles(50);
      const signals = await storage.getRecentSignals(20);
      const metric = await storage.getLatestMetric();
      const dynamicSuccessRate = await predictionEngine.getDynamicSuccessRate();

      ws.send(JSON.stringify({
        type: "initial_state",
        data: {
          ticks: [...ticks].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
          candles: [...candles].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
          signals: [...signals].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
          metrics: {
            ...metric,
            dynamicSuccessRate,
          },
        },
      }));
    } catch (error) {
      console.error("[WebSocket] Error sending initial state:", error);
    }
  }

  return httpServer;
}
