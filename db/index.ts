import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';


const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("No connection string found. Please include DATABASE_URL in ENV file")
}

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, {schema});

 