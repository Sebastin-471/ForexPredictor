import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

// Prefer DATABASE_URL for simplicity (especially on VPS)
// Otherwise construct from individual variables
const connectionString = process.env.DATABASE_URL || (() => {
  const dbConfig = {
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "forex_predictor",
  };
  const encodedPassword = encodeURIComponent(dbConfig.password || "");
  return `postgresql://${dbConfig.user}:${encodedPassword}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
})();

export const pool = new Pool({ 
  connectionString: typeof connectionString === 'string' ? connectionString : connectionString
});

export const db = drizzle(pool, { schema });
