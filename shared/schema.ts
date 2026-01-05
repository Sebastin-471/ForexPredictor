import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  real,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Ticks table - raw price data
export const ticks = pgTable("ticks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  pair: text("pair").notNull().default("EUR/USD"),
  bid: real("bid").notNull(),
  ask: real("ask").notNull(),
  mid: real("mid").notNull(),
});

export const insertTickSchema = createInsertSchema(ticks).omit({
  id: true,
  timestamp: true,
});
export type InsertTick = z.infer<typeof insertTickSchema>;
export type Tick = typeof ticks.$inferSelect;

// Candles table - aggregated 1-minute OHLCV
export const candles = pgTable("candles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  pair: text("pair").notNull().default("EUR/USD"),
  open: real("open").notNull(),
  high: real("high").notNull(),
  low: real("low").notNull(),
  close: real("close").notNull(),
  volume: integer("volume").notNull().default(0),
});

export const insertCandleSchema = createInsertSchema(candles).omit({
  id: true,
});
export type InsertCandle = z.infer<typeof insertCandleSchema>;
export type Candle = typeof candles.$inferSelect;

// Signals table - predictions from the model
export const signals = pgTable("signals", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  pair: text("pair").notNull().default("EUR/USD"),
  direction: text("direction").notNull(), // "UP" or "DOWN"
  probability: real("probability").notNull(),
  modelVersion: text("model_version").notNull(),
  features: text("features"), // JSON string of features used
  actualDirection: text("actual_direction"), // Actual result after 1 minute
  isCorrect: boolean("is_correct"), // Whether prediction was correct
  priceAtPrediction: real("price_at_prediction"),
  priceAfterMinute: real("price_after_minute"),
});

export const insertSignalSchema = createInsertSchema(signals).omit({
  id: true,
  timestamp: true,
});
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Signal = typeof signals.$inferSelect;

// Model metrics table - track model performance over time
export const modelMetrics = pgTable("model_metrics", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  modelVersion: text("model_version").notNull(),
  accuracy: real("accuracy").notNull(),
  precision: real("precision").notNull(),
  recall: real("recall").notNull(),
  totalSignals: integer("total_signals").notNull(),
  correctSignals: integer("correct_signals").notNull(),
  windowSize: integer("window_size").notNull(), // Number of signals in the window
});

export const insertModelMetricSchema = createInsertSchema(modelMetrics).omit({
  id: true,
  timestamp: true,
});
export type InsertModelMetric = z.infer<typeof insertModelMetricSchema>;
export type ModelMetric = typeof modelMetrics.$inferSelect;
