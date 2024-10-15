import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import * as schema from "./schema";

export const client = new Client(process.env.TICKETS_DATABASE_URL);

// { schema } is used for relational queries
export const db = drizzle(client, { schema });
