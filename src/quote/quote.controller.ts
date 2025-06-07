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
  BadRequestException,
} from '@nestjs/common';
import { QuoteService } from './quote.service';
import { CreateQuoteDto, UpdateQuoteDto, QuoteQueryDto } from './dto/quote.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from './interfaces/auth.interface';

@Controller('quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  // Public endpoint - ไม่ต้องผ่าน middleware
  @Get('all')
  async getAllQuotes(@Query() query: QuoteQueryDto) {
    try {
      const result = await this.quoteService.getAllQuotes(query);
      return {
        success: true,
        message: 'Quotes fetched successfully',
        ...result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch quotes',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Public endpoint - ไม่ต้องผ่าน middleware
  @Get('top-voted')
  async getTopVotedQuotes() {
    try {
      const data = await this.quoteService.getTopVotedQuotes();
      return {
        success: true,
        message: 'Top voted quotes fetched successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch top voted quotes',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Protected endpoint - ต้องผ่าน middleware
  @Get('my-quotes')
  @UseGuards(JwtAuthGuard)
  async getUserQuotes(
    @Query() query: QuoteQueryDto,
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
      
      const result = await this.quoteService.getUserQuotes(query, req.user.id);
      return {
        success: true,
        message: 'Get user quotes successfully',
        ...result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch user quotes',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Protected endpoint - ต้องผ่าน middleware
  @Get('summary/personal')
  @UseGuards(JwtAuthGuard)
  async getPersonalSummary(@Req() req: AuthenticatedRequest) {
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
      
      return await this.quoteService.getPersonalSummary(req.user);
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Protected endpoint - ต้องผ่าน middleware
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createQuote(
    @Body() createQuoteDto: CreateQuoteDto,
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
      
      const data = await this.quoteService.createQuote(createQuoteDto, req.user.id);
      return {
        success: true,
        message: 'Quote created successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to create quote',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Protected endpoint - ต้องผ่าน middleware
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getQuoteById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      // Validate user
      if (!req.user) {
        throw new HttpException(
          {
            success: false,
            message: 'User not found in request',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Validate ID
      const quoteId = Number(id);
      if (!quoteId || isNaN(quoteId)) {
        throw new BadRequestException({
          success: false,
          message: 'Valid quote ID is required',
        });
      }

      const data = await this.quoteService.getQuoteById(quoteId);
      
      return {
        success: true,
        message: 'Quote fetched successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch quote',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Protected endpoint - ต้องผ่าน middleware
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateQuote(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    id: number,
    @Body() updateQuoteDto: UpdateQuoteDto,
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
      
      const data = await this.quoteService.updateQuote(id, updateQuoteDto, req.user.id);
      return {
        success: true,
        message: 'Quote updated successfully',
        data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to update quote',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Protected endpoint - ต้องผ่าน middleware
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteQuote(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    id: number,
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
      
      await this.quoteService.deleteQuote(id, req.user.id);
      return {
        success: true,
        message: 'Quote deleted successfully',
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to delete quote',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}