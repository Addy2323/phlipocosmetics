import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../drizzle/schema";

const connectionString =
  process.env["DATABASE_URL"] ||
  "postgresql://postgres:myamba2323@127.0.0.1:5432/philipo?schema=public";

// Singleton query client for PostgreSQL
export const queryClient = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });
export { schema };
