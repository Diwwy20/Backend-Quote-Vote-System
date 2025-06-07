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
  BadRequestException,
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
    try {
      if (!req.user) {
        throw new HttpException(
          {
            success: false,
            message: 'User not found in request',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Validate vote_value
      const { vote_value } = voteQuoteDto;
      if (vote_value === undefined || ![-1, 1].includes(Number(vote_value))) {
        throw new BadRequestException({
          success: false,
          message: 'Vote value must be 1 or -1',
        });
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

      const statusCode = vote_value === 1 ? HttpStatus.CREATED : HttpStatus.OK;
      
      return {
        success: true,
        message: data.message,
        data: {
          quote_id: data.quote_id,
          vote_value: data.vote_value || null,
        },
      };
    } catch (error: any) {
      // Handle BadRequestException with custom data
      if (error instanceof BadRequestException && error.getResponse()) {
        const response = error.getResponse() as any;
        if (response.current_voted_quote_id) {
          throw new HttpException(
            {
              success: false,
              message: response.message,
              data: {
                current_voted_quote_id: response.current_voted_quote_id,
              },
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to process vote',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('check/:quoteId')
  @UseGuards(JwtAuthGuard)
  async checkVoteEligibility(
    @Param('quoteId', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    quoteId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
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
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to check vote eligibility',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}