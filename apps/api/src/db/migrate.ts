import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({
    path: './.env',
});

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({
    connectionString,
    max: 1,
});

const db = drizzle(pool);

async function main() {
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log("Migrations finished.");
    await pool.end();
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
