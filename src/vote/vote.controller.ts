import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { VoteService } from './vote.service';
import { VoteQuoteDto } from './dto/vote.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from './interfaces/auth.interface';

@Controller('vote')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post(':quoteId')
  @UseGuards(JwtAuthGuard)
  async voteQuote(
    @Param('quoteId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    quoteId: number,
    @Body() voteQuoteDto: VoteQuoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new HttpException(
        {
          success: false,
          message: 'User not found in request',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const data = await this.voteService.voteQuote(quoteId, voteQuoteDto, req.user.id);
    
    if (!data) {
        throw new HttpException(
            {
            success: false,
            message: 'Unexpected error: vote result is undefined',
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }

    const statusCode = voteQuoteDto.vote_value === 1 ? HttpStatus.CREATED : HttpStatus.OK;
    
    return {
      success: true,
      message: data.message,
      data: {
        quote_id: data.quote_id,
        vote_value: data.vote_value || null,
      },
    };
  }

  @Get('check/:quoteId')
  @UseGuards(JwtAuthGuard)
  async checkVoteEligibility(
    @Param('quoteId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    quoteId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new HttpException(
        {
          success: false,
          message: 'User not found in request',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const data = await this.voteService.checkVoteEligibility(quoteId, req.user.id);
    
    return {
      success: true,
      message: 'Vote eligibility checked',
      data,
    };
  }

  @Get('my-vote')
  @UseGuards(JwtAuthGuard)
  async getUserCurrentVote(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
      throw new HttpException(
        {
          success: false,
          message: 'User not found in request',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const data = await this.voteService.getUserCurrentVote(req.user.id);
    
    return {
      success: true,
      message: data ? 'Current vote found' : 'No current vote found',
      data,
    };
  }
}