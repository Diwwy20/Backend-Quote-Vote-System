import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    })
  ],
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}