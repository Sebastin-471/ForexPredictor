import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const dbConfig = {
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "forex_predictor",
};

// Construct connection string for Drizzle and other tools
const encodedPassword = encodeURIComponent(dbConfig.password || "");
const connectionString = `postgresql://${dbConfig.user}:${encodedPassword}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

export const pool = new Pool({ 
  connectionString
});

export const db = drizzle(pool, { schema });
