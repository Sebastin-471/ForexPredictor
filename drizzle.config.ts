import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const dbConfig = {
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "forex_predictor",
};

const encodedPassword = encodeURIComponent(dbConfig.password || "");
const connectionString = `postgresql://${dbConfig.user}:${encodedPassword}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
