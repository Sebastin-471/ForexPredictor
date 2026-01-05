import { Client } from "pg";

async function createDatabase() {
  const client = new Client({
    connectionString: "postgresql://postgres:pFS<fYDpdt]q6},[OF2'@localhost:5432/postgres"
  });

  try {
    await client.connect();
    console.log("Connected to postgres database.");
    
    const dbName = "forex_predictor";
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    
    if (res.rowCount === 0) {
      console.log(`Creating database ${dbName}...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully.`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } catch (err) {
    console.error("Error creating database:", err);
  } finally {
    await client.end();
  }
}

createDatabase();
