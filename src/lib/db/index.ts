import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// The `pg` pool defers connecting until the first query is executed, so
// constructing it at module load is cheap. Tests stub DATABASE_URL via
// vitest.setup.ts; the pool never opens because tests mock @/lib/db.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });
