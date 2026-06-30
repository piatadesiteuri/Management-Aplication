import { Pool } from 'pg';

export const pool = new Pool({
  user: 'root',
  host: 'localhost',
  database: 'DSPD',
  password: '',
  port: 5432,
}); 