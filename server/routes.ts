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

  // Start the services automatically
  tickSimulator.start();
  candleAggregator.start();
  predictionEngine.start();

  // Set up real-time broadcasting
  setInterval(async () => {
    try {
      // Broadcast latest tick
      const ticks = await storage.getRecentTicks(1);
      if (ticks.length > 0) {
        const tick = ticks[0];
        
        // Update candle aggregator
        await candleAggregator.processTick(tick.mid);
        
        broadcast({
          type: "tick",
          data: tick,
        });
      }

      // Broadcast current candle state
      const currentCandle = candleAggregator.getCurrentCandle();
      if (currentCandle) {
        broadcast({
          type: "candle_update",
          data: currentCandle,
        });
      }
    } catch (error) {
      console.error("[Broadcast] Error:", error);
    }
  }, 500); // Every 500ms

  // Broadcast new signals
  setInterval(async () => {
    try {
      const signals = await storage.getRecentSignals(1);
      if (signals.length > 0) {
        broadcast({
          type: "signal",
          data: signals[0],
        });
      }
    } catch (error) {
      console.error("[Broadcast Signal] Error:", error);
    }
  }, 5000); // Every 5 seconds

  // Broadcast metrics update
  setInterval(async () => {
    try {
      const metric = await storage.getLatestMetric();
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
  }, 10000); // Every 10 seconds

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
          ticks,
          candles,
          signals,
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
