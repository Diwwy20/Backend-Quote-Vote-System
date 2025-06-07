import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { QuoteModule } from './quote/quote.module';
import { RedisModule } from './redis/redis.module';
import { VoteModule } from './vote/vote.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    QuoteModule,
    VoteModule,
    RedisModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
