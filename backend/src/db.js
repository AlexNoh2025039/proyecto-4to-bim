import pg from 'pg';

const { Pool } = pg;

const defaultDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/talentbridge_in5bm';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || defaultDatabaseUrl,
});