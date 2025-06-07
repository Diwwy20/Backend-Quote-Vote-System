import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';

@Module({
  imports: [ConfigModule],
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}