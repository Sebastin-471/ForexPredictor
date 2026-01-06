import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Use DATABASE_URL if present, otherwise construct it
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

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
