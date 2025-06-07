import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

export const sql = neon(process.env.DB_URL as string);