import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({
    path: './.env',
});

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({
    connectionString,
});

export const db = drizzle(pool);
