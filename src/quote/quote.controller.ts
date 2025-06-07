import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { QuoteService } from './quote.service';
import { CreateQuoteDto, UpdateQuoteDto, QuoteQueryDto } from './dto/quote.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from './interfaces/auth.interface';

@Controller('quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Get('all')
  async getAllQuotes(@Query() query: QuoteQueryDto) {
    const result = await this.quoteService.getAllQuotes(query);
    return {
      success: true,
      message: 'Quotes fetched successfully',
      ...result,
    };
  }



  @Get('my-quotes')
  @UseGuards(JwtAuthGuard)
  async getUserQuotes(
    @Query() query: QuoteQueryDto,
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
    const result = await this.quoteService.getUserQuotes(query, req.user.id);
    return {
      success: true,
      message: 'Get user quotes successfully',
      ...result,
    };
  }

  @Get('summary/personal')
  @UseGuards(JwtAuthGuard)
  async getPersonalSummary(@Req() req: AuthenticatedRequest) {
    if (!req.user) {
        throw new HttpException(
          {
            success: false,
            message: 'User not found in request',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
    const data = await this.quoteService.getPersonalSummary(req.user.id);
    return {
      success: true,
      message: 'Personal summary fetched successfully',
      data,
    };
  }

  @Get('top-voted')
  async getTopVotedQuotes() {
    const data = await this.quoteService.getTopVotedQuotes();
    return {
      success: true,
      message: 'Top voted quotes fetched successfully',
      data,
    };
  }

  @Get(':id')
  async getQuoteById(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    id: number,
  ) {
    const data = await this.quoteService.getQuoteById(id);
    return {
      success: true,
      message: 'Quote fetched successfully',
      data,
    };
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createQuote(
    @Body() createQuoteDto: CreateQuoteDto,
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
    const data = await this.quoteService.createQuote(createQuoteDto, req.user.id);
    return {
      success: true,
      message: 'Quote created successfully',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateQuote(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    id: number,
    @Body() updateQuoteDto: UpdateQuoteDto,
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
    const data = await this.quoteService.updateQuote(id, updateQuoteDto, req.user.id);
    return {
      success: true,
      message: 'Quote updated successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteQuote(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    id: number,
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
    await this.quoteService.deleteQuote(id, req.user.id);
    return {
      success: true,
      message: 'Quote deleted successfully',
    };
  }
}