import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

export type SurveyDatabase = NeonHttpDatabase<typeof schema>;

const globalDatabase = globalThis as typeof globalThis & {
  __hbkrSurveyDatabase?: SurveyDatabase;
};

export function getDb(): SurveyDatabase {
  if (globalDatabase.__hbkrSurveyDatabase) {
    return globalDatabase.__hbkrSurveyDatabase;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const client = neon(connectionString);
  const database = drizzle(client, { schema });
  globalDatabase.__hbkrSurveyDatabase = database;

  return database;
}
