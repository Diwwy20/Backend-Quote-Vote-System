import { Module, Global } from '@nestjs/common';
import { sql } from '../config/db';

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async () => {
        try {
          await sql`
            CREATE TABLE IF NOT EXISTS quotes (
              id SERIAL PRIMARY KEY,
              user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
              content TEXT NOT NULL, 
              author VARCHAR(255) NOT NULL,
              category VARCHAR(50),
              tags TEXT, 
              vote_count INT DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `;

          await sql`
            CREATE TABLE IF NOT EXISTS votes (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
              quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
              vote_value INTEGER NOT NULL CHECK (vote_value IN (-1, 1)), 
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE (user_id, quote_id)
            )
          `;
          console.log('Database initialized successfully');
          return sql;
        } catch (error) {
          console.error('Error initDb', error);
          throw error;
        }
      },
    },
  ],
  exports: ['DATABASE_CONNECTION'],
})
export class DatabaseModule {}