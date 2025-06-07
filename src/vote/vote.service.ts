import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { sql } from '../config/db';
import { VoteQuoteDto } from './dto/vote.dto';

@Injectable()
export class VoteService {
  async voteQuote(quoteId: number, voteQuoteDto: VoteQuoteDto, userId: string) {
    const { vote_value } = voteQuoteDto;

    // Check if quote exists
    const quote = await sql`
      SELECT id, vote_count FROM quotes WHERE id = ${quoteId}
    `;

    if (quote.length === 0) {
      throw new NotFoundException('Quote not found');
    }

    try {
      await sql`BEGIN`;

      if (vote_value === 1) {
        // Check if user has already voted for any quote
        const existingVote = await sql`
          SELECT id, quote_id, vote_value FROM votes WHERE user_id = ${userId}
        `;

        if (existingVote.length > 0) {
          const oldVote = existingVote[0];
          
          // If user already voted for this quote
          if (oldVote.quote_id === quoteId) {
            await sql`ROLLBACK`;
            throw new BadRequestException('You have already voted for this quote');
          }

          // If user voted for another quote, block the vote
          await sql`ROLLBACK`;
          throw new BadRequestException({
            message: 'You have already voted for another quote. Please remove your current vote first before voting for a new quote.',
            current_voted_quote_id: oldVote.quote_id
          });
        }

        // Create new vote
        await sql`
          INSERT INTO votes (user_id, quote_id, vote_value)
          VALUES (${userId}, ${quoteId}, 1)
        `;

        // Update quote vote count
        await sql`
          UPDATE quotes SET vote_count = vote_count + 1 WHERE id = ${quoteId}
        `;

        await sql`COMMIT`;

        return {
          quote_id: quoteId,
          vote_value: 1,
          message: 'Vote submitted successfully'
        };
      }

      if (vote_value === -1) {
        // Check if user has voted for this quote
        const existingVote = await sql`
          SELECT id FROM votes WHERE user_id = ${userId} AND quote_id = ${quoteId}
        `;

        if (existingVote.length === 0) {
          await sql`ROLLBACK`;
          throw new BadRequestException('You have not voted for this quote');
        }

        // Remove vote
        await sql`
          DELETE FROM votes WHERE id = ${existingVote[0].id}
        `;

        // Decrease quote vote count
        await sql`
          UPDATE quotes SET vote_count = GREATEST(0, vote_count - 1) WHERE id = ${quoteId}
        `;

        await sql`COMMIT`;

        return {
          quote_id: quoteId,
          message: 'Vote removed successfully'
        };
      }

    } catch (error: any) {
      await sql`ROLLBACK`;
      
      // Re-throw known exceptions
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      // Handle unexpected errors
      throw new Error(`Failed to process vote: ${error.message}`);
    }
  }

  async checkVoteEligibility(quoteId: number, userId: string) {
    // Check if quote exists and get vote count
    const quote = await sql`
      SELECT id, vote_count 
      FROM quotes 
      WHERE id = ${quoteId}
    `;

    if (quote.length === 0) {
      throw new NotFoundException('Quote not found');
    }

    // Check if user has already voted for this quote
    const existingVote = await sql`
      SELECT id, vote_value 
      FROM votes 
      WHERE user_id = ${userId} AND quote_id = ${quoteId}
    `;

    const canVote = quote[0].vote_count === 0 && existingVote.length === 0;

    return {
      quote_id: quoteId,
      can_vote: canVote,
      reasons: {
        quote_has_zero_votes: quote[0].vote_count === 0,
        user_has_not_voted: existingVote.length === 0,
      },
      existing_vote: existingVote.length > 0 ? {
        vote_value: existingVote[0].vote_value,
      } : null,
    };
  }

  async getUserCurrentVote(userId: string) {
    const currentVote = await sql`
      SELECT 
        v.id,
        v.quote_id,
        v.vote_value,
        v.created_at,
        q.content,
        q.author,
        q.vote_count
      FROM votes v
      JOIN quotes q ON v.quote_id = q.id
      WHERE v.user_id = ${userId}
    `;

    return currentVote.length > 0 ? currentVote[0] : null;
  }
}