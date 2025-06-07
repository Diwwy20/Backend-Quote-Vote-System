import { IsNotEmpty, IsInt, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class VoteQuoteDto {
  @IsNotEmpty()
  @IsInt()
  @IsIn([1, -1], { message: 'Vote value must be 1 (upvote) or -1 (remove vote)' })
  vote_value: number;
}

export class CheckVoteEligibilityDto {
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @IsNotEmpty()
  quoteId: number;
}