import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { sql } from '../config/db';
import { CreateQuoteDto, UpdateQuoteDto, QuoteQueryDto } from './dto/quote.dto';
import { User } from './interfaces/auth.interface';

@Injectable()
export class QuoteService {
  async getAllQuotes(query: QuoteQueryDto, user?: User) {
    const {
      category,
      author,
      search,
      sortBy = 'vote_count',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = query;

    const validSortFields = ['vote_count', 'created_at', 'updated_at', 'author'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'vote_count';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;
    
    try {
      // Query สำหรับดึงข้อมูล quotes พร้อม voted_users
      const quotesQuery = sql`
        SELECT 
          q.id, 
          q.content, 
          q.author, 
          q.category, 
          q.tags, 
          q.vote_count, 
          q.created_at, 
          q.updated_at,
          q.user_id,
          u.name AS user_name,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'user_id', v.user_id,
                'user_name', vu.name,
                'user_avatar', vu.avatar
              )
            ) FILTER (WHERE v.user_id IS NOT NULL), 
            '[]'
          ) AS voted_users
        FROM quotes q
        JOIN users u ON q.user_id = u.id
        LEFT JOIN votes v ON q.id = v.quote_id
        LEFT JOIN users vu ON v.user_id = vu.id
        WHERE
          ${category ? sql`q.category = ${category}` : sql`TRUE`}
          AND ${author ? sql`q.author ILIKE ${`%${author}%`}` : sql`TRUE`}
          AND ${search ? sql`(q.content ILIKE ${`%${search}%`} OR q.author ILIKE ${`%${search}%`})` : sql`TRUE`}
        GROUP BY q.id, u.name
        ORDER BY q.${sql.unsafe(sortField)} ${sql.unsafe(sortDirection)}
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Query สำหรับนับจำนวนรวม
      const countQuery = sql`
        SELECT COUNT(*) AS total
        FROM quotes q
        WHERE
          ${category ? sql`q.category = ${category}` : sql`TRUE`}
          AND ${author ? sql`q.author ILIKE ${`%${author}%`}` : sql`TRUE`}
          AND ${search ? sql`(q.content ILIKE ${`%${search}%`} OR q.author ILIKE ${`%${search}%`})` : sql`TRUE`}
      `;

      const quotesResult = await quotesQuery;
      const totalResult = await countQuery;

      const totalCount = parseInt((totalResult[0] as any)?.total || '0');

      // Process quotes data
      const processedQuotes = quotesResult.map((quote: any) => ({
        ...quote,
        tags: Array.isArray(quote.tags) 
          ? quote.tags 
          : quote.tags 
            ? (typeof quote.tags === 'string' 
              ? JSON.parse(quote.tags) 
              : []) 
            : [],
        user_name: quote.user_name || null,
        voted_users: Array.isArray(quote.voted_users) 
          ? quote.voted_users 
          : quote.voted_users 
            ? JSON.parse(quote.voted_users) 
            : [],
      }));

      return {
        data: processedQuotes,
        pagination: {
          page,
          limit,
          total: totalCount,
        },
      };

    } catch (error: any) {
      console.error('Error in getAllQuotes:', error);
      throw new Error('Internal server error while fetching quotes');
    }
  }

  async getUserQuotes(query: QuoteQueryDto, userId: string) {
    const { 
      category, 
      search, 
      sortBy = 'vote_count', 
      sortOrder = 'DESC',
      page = 1,
      limit = 10 
    } = query;

    const validSortFields = ['vote_count', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'vote_count';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const offset = (page - 1) * limit;

    let quotes;
    let totalResult;

    // Build queries based on filters
    if (category && search) {
      quotes = await sql`
        SELECT id, content, author, category, tags, vote_count, created_at, updated_at
        FROM quotes
        WHERE user_id = ${userId}
        AND category = ${category} 
        AND content ILIKE ${`%${search}%`}
        ORDER BY 
          CASE WHEN ${sortField} = 'vote_count' AND ${sortDirection} = 'DESC' THEN vote_count END DESC,
          CASE WHEN ${sortField} = 'vote_count' AND ${sortDirection} = 'ASC' THEN vote_count END ASC,
          CASE WHEN ${sortField} = 'created_at' AND ${sortDirection} = 'DESC' THEN created_at END DESC,
          CASE WHEN ${sortField} = 'created_at' AND ${sortDirection} = 'ASC' THEN created_at END ASC,
          CASE WHEN ${sortField} = 'updated_at' AND ${sortDirection} = 'DESC' THEN updated_at END DESC,
          CASE WHEN ${sortField} = 'updated_at' AND ${sortDirection} = 'ASC' THEN updated_at END ASC,
          created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) as total
        FROM quotes
        WHERE user_id = ${userId}
        AND category = ${category} 
        AND content ILIKE ${`%${search}%`}
      `;
    } else if (category) {
      quotes = await sql`
        SELECT id, content, author, category, tags, vote_count, created_at, updated_at
        FROM quotes
        WHERE user_id = ${userId}
        AND category = ${category}
        ORDER BY 
          CASE WHEN ${sortField} = 'vote_count' AND ${sortDirection} = 'DESC' THEN vote_count END DESC,
          CASE WHEN ${sortField} = 'vote_count' AND ${sortDirection} = 'ASC' THEN vote_count END ASC,
          CASE WHEN ${sortField} = 'created_at' AND ${sortDirection} = 'DESC' THEN created_at END DESC,
          CASE WHEN ${sortField} = 'created_at' AND ${sortDirection} = 'ASC' THEN created_at END ASC,
          CASE WHEN ${sortField} = 'updated_at' AND ${sortDirection} = 'DESC' THEN updated_at END DESC,
          CASE WHEN ${sortField} = 'updated_at' AND ${sortDirection} = 'ASC' THEN updated_at END ASC,
          created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) as total
        FROM quotes
        WHERE user_id = ${userId}
        AND category = ${category}
      `;
    } else if (search) {
      quotes = await sql`
        SELECT id, content, author, category, tags, vote_count, created_at, updated_at
        FROM quotes
        WHERE user_id = ${userId}
        AND content ILIKE ${`%${search}%`}
        ORDER BY 
          CASE WHEN ${sortField} = 'vote_count' AND ${sortDirection} = 'DESC' THEN vote_count END DESC,
          CASE WHEN ${sortField} = 'vote_count' AND ${sortDirection} = 'ASC' THEN vote_count END ASC,
          CASE WHEN ${sortField} = 'created_at' AND ${sortDirection} = 'DESC' THEN created_at END DESC,
          CASE WHEN ${sortField} = 'created_at' AND ${sortDirection} = 'ASC' THEN created_at END ASC,
          CASE WHEN ${sortField} = 'updated_at' AND ${sortDirection} = 'DESC' THEN updated_at END DESC,
          CASE WHEN ${sortField} = 'updated_at' AND ${sortDirection} = 'ASC' THEN updated_at END ASC,
          created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) as total
        FROM quotes
        WHERE user_id = ${userId}
        AND content ILIKE ${`%${search}%`}
      `;
    } else {
      quotes = await sql`
        SELECT id, content, author, category, tags, vote_count, created_at, updated_at
        FROM quotes
        WHERE user_id = ${userId}
        ORDER BY 
          CASE WHEN ${sortField} = 'vote_count' AND ${sortDirection} = 'DESC' THEN vote_count END DESC,
          CASE WHEN ${sortField} = 'vote_count' AND ${sortDirection} = 'ASC' THEN vote_count END ASC,
          CASE WHEN ${sortField} = 'created_at' AND ${sortDirection} = 'DESC' THEN created_at END DESC,
          CASE WHEN ${sortField} = 'created_at' AND ${sortDirection} = 'ASC' THEN created_at END ASC,
          CASE WHEN ${sortField} = 'updated_at' AND ${sortDirection} = 'DESC' THEN updated_at END DESC,
          CASE WHEN ${sortField} = 'updated_at' AND ${sortDirection} = 'ASC' THEN updated_at END ASC,
          created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      totalResult = await sql`
        SELECT COUNT(*) as total
        FROM quotes
        WHERE user_id = ${userId}
      `;
    }

    const total = parseInt(totalResult[0].total);
    
    return {
      data: quotes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  async createQuote(createQuoteDto: CreateQuoteDto, userId: string) {
    const { content, author, category, tags } = createQuoteDto;

    // Process tags
    let processedTags: string | null = null;

    if (tags) {
    const cleanedTags = tags
        .filter(tag => tag && tag.trim().length > 0)
        .map(tag => tag.trim().toLowerCase())
        .slice(0, 10);

    processedTags = cleanedTags.length > 0 ? JSON.stringify(cleanedTags) : null;
    }

    // Check for duplicate quote by same user
    const existingQuote = await sql`
      SELECT id FROM quotes 
      WHERE user_id = ${userId} 
      AND LOWER(TRIM(content)) = ${content.trim().toLowerCase()}
    `;

    if (existingQuote.length > 0) {
      throw new ConflictException('You have already created this quote');
    }

    // Insert new quote
    const newQuote = await sql`
      INSERT INTO quotes (
        user_id, 
        content, 
        author, 
        category, 
        tags, 
        vote_count,
        created_at, 
        updated_at
      ) VALUES (
        ${userId},
        ${content.trim()},
        ${author.trim()},
        ${category?.toLowerCase() || null},
        ${processedTags},
        0,
        NOW(),
        NOW()
      )
      RETURNING id, content, author, category, tags, vote_count, created_at, updated_at
    `;

    return {
      ...newQuote[0],
      tags: newQuote[0].tags ? JSON.parse(newQuote[0].tags) : []
    };
  }

  async getQuoteById(id: number) {
    const quote = await sql`
      SELECT 
        q.id,
        q.content,
        q.author,
        q.category,
        q.tags,
        q.vote_count,
        q.created_at,
        q.updated_at,
        u.name AS user_name
      FROM quotes q
      LEFT JOIN users u ON q.user_id = u.id
      WHERE q.id = ${id}
    `;

    if (quote.length === 0) {
      throw new NotFoundException('Quote not found');
    }

    const result = quote[0];

    return {
      id: result.id,
      content: result.content,
      author: result.author,
      category: result.category,
      tags: result.tags ? JSON.parse(result.tags) : [],
      vote_count: result.vote_count,
      created_at: result.created_at,
      updated_at: result.updated_at,
      user_name: result.user_name || null,
    };
  }

  async updateQuote(id: number, updateQuoteDto: UpdateQuoteDto, userId: string) {
    const { content, author, category, tags } = updateQuoteDto;

    // Check if quote exists and belongs to user
    const quote = await sql`
      SELECT id, user_id, vote_count 
      FROM quotes 
      WHERE id = ${id}
    `;

    if (quote.length === 0) {
      throw new NotFoundException('Quote not found');
    }

    if (quote[0].user_id !== userId) {
      throw new ForbiddenException('You can only edit your own quotes');
    }

    if (quote[0].vote_count !== 0) {
      throw new ForbiddenException('Cannot edit quote that has been voted on');
    }

    // Update quote
    const updatedQuote = await sql`
      UPDATE quotes 
      SET 
        content = ${content || quote[0].content},
        author = ${author || quote[0].author},
        category = ${category || quote[0].category},
        tags = ${tags ? JSON.stringify(tags) : quote[0].tags},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    return {
      id: updatedQuote[0].id,
      content: updatedQuote[0].content,
      author: updatedQuote[0].author,
      category: updatedQuote[0].category,
      tags: updatedQuote[0].tags ? JSON.parse(updatedQuote[0].tags) : [],
      vote_count: updatedQuote[0].vote_count,
      created_at: updatedQuote[0].created_at,
      updated_at: updatedQuote[0].updated_at,
    };
  }

  async deleteQuote(id: number, userId: string) {
    // Check if quote exists and belongs to user
    const quote = await sql`
      SELECT id, user_id, vote_count 
      FROM quotes 
      WHERE id = ${id}
    `;

    if (quote.length === 0) {
      throw new NotFoundException('Quote not found');
    }

    if (quote[0].user_id !== userId) {
      throw new ForbiddenException('You can only delete your own quotes');
    }

    if (quote[0].vote_count !== 0) {
      throw new ForbiddenException('Cannot delete quote that has been voted on');
    }

    // Delete quote
    await sql`
      DELETE FROM quotes 
      WHERE id = ${id}
    `;

    return { message: 'Quote deleted successfully' };
  }

  async getPersonalSummary(userId: string) {
    try {
      // 1. Total Quotes ที่สร้างของตัวเอง
      const userQuotesResult = await sql`
        SELECT COUNT(*) as my_quotes_count FROM quotes WHERE user_id = ${userId}
      `;
      const totalQuotesCreated = Number(userQuotesResult[0].my_quotes_count);

      // 2. Total Votes ที่ได้รับทั้งหมดของตัวเอง
      const userVotesResult = await sql`
        SELECT COALESCE(SUM(vote_count), 0) as total_votes_received 
        FROM quotes 
        WHERE user_id = ${userId}
      `;
      const totalVotesReceived = Number(userVotesResult[0].total_votes_received);

      // 3. Ranking การจัดอันดับเมื่อเทียบกับทุกคน
      const userRankResult = await sql`
        WITH user_stats AS (
          SELECT 
            u.id,
            COALESCE(SUM(q.vote_count), 0) as total_votes_received
          FROM users u
          LEFT JOIN quotes q ON u.id = q.user_id
          GROUP BY u.id
        ),
        ranked_users AS (
          SELECT 
            id,
            total_votes_received,
            ROW_NUMBER() OVER (ORDER BY total_votes_received DESC) as rank
          FROM user_stats
          WHERE total_votes_received > 0
        )
        SELECT rank FROM ranked_users WHERE id = ${userId}
      `;
      const userRank = userRankResult.length > 0 ? Number(userRankResult[0].rank) : null;

      // 4. Category Distribution
      const userCategoriesResult = await sql`
        SELECT 
          LOWER(category) as category,
          COUNT(*) as count
        FROM quotes
        WHERE user_id = ${userId} AND category IS NOT NULL
        GROUP BY LOWER(category)
        ORDER BY count DESC
      `;

      const totalCategorizedQuotes = userCategoriesResult.reduce(
        (sum, cat) => sum + Number(cat.count),
        0
      );

      const categoryDistribution = userCategoriesResult.map(cat => {
        const count = Number(cat.count);
        const percentage = totalCategorizedQuotes > 0
          ? Math.round((count / totalCategorizedQuotes) * 10000) / 100
          : 0;

        return {
          category: cat.category,
          count,
          percentage
        };
      });

      return {
        total_quotes_created: totalQuotesCreated,
        total_votes_received: totalVotesReceived,
        ranking: userRank,
        category_distribution: categoryDistribution
      };

    } catch (error: any) {
      console.error('Error fetching personal summary:', error);
      throw new Error('Failed to fetch personal summary');
    }
  }

  async getTopVotedQuotes() {
    try {
      const topQuotes = await sql`
        SELECT 
          q.id,
          q.content,
          q.author,
          q.category,
          q.vote_count,
          q.created_at,
          u.name as creator_name
        FROM quotes q
        LEFT JOIN users u ON q.user_id = u.id
        ORDER BY q.vote_count DESC, q.created_at DESC
        LIMIT 3
      `;

      return topQuotes.map((quote, index) => ({
        rank: index + 1,
        id: quote.id,
        content: quote.content,
        author: quote.author,
        category: quote.category,
        vote_count: quote.vote_count,
        creator_name: quote.creator_name,
        created_at: quote.created_at
      }));

    } catch (error: any) {
      console.error('Error fetching top voted quotes:', error);
      throw new Error('Failed to fetch top voted quotes');
    }
  }
}