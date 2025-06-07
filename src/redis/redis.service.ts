import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {
    this.client = createClient({
      password: this.configService.get<string>('Redis_Password'),
      socket: {
        host: this.configService.get<string>('Redis_Host'),
        port: Number(this.configService.get<number>('Redis_Port')),
      },
    });
  }

  async onModuleInit() {
    await this.client.connect();
    console.log('Connected to Redis');
  }

  getClient() {
    return this.client;
  }
}