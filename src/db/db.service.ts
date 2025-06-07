import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';

@Injectable()
export class DbService {
  private sql: ReturnType<typeof neon>;

  constructor(private configService: ConfigService) {
    const dbUrl = this.configService.get<string>('DB_URL');
    if (!dbUrl) throw new Error('DB_URL not found in environment variables');
    this.sql = neon(dbUrl);
  }

  getConnection() {
    return this.sql;
  }
}