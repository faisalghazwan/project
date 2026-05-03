import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(process.env.DB_PATH ?? "reps.db");
const db = drizzle(sqlite, { schema });

const starter = [
  { name: "back squat", category: "legs" },
  { name: "front squat", category: "legs" },
  { name: "deadlift", category: "back" },
  { name: "romanian deadlift", category: "back" },
  { name: "bench press", category: "chest" },
  { name: "incline bench press", category: "chest" },
  { name: "overhead press", category: "shoulders" },
  { name: "barbell row", category: "back" },
  { name: "pull up", category: "back" },
  { name: "chin up", category: "back" },
  { name: "dip", category: "chest" },
  { name: "lunge", category: "legs" },
  { name: "leg press", category: "legs" },
  { name: "lat pulldown", category: "back" },
  { name: "seated row", category: "back" },
  { name: "bicep curl", category: "arms" },
  { name: "tricep extension", category: "arms" },
  { name: "lateral raise", category: "shoulders" },
  { name: "face pull", category: "shoulders" },
  { name: "calf raise", category: "legs" },
];

async function main() {
  await db
    .insert(schema.exercises)
    .values(starter)
    .onConflictDoNothing();

  console.log(`seeded ${starter.length} exercises`);
  sqlite.close();
}

main();
