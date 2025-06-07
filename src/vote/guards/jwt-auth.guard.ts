import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { sql } from 'src/config/db';
import { User } from '../interfaces/auth.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Access token is required (Bearer token)');
      }

      const token = authHeader.replace('Bearer ', '');

      // ตรวจสอบความถูกต้องของ token
      const decodedValue = jwt.verify(
        token,
        this.configService.get('JWT_SEC') as string,
      ) as JwtPayload;

      // token ไม่ถูกต้องหรือไม่มี id = 401 Unauthorized
      if (!decodedValue || !decodedValue.id) {
        throw new UnauthorizedException('Invalid or malformed token');
      }

      const userId = decodedValue.id;

      // ค้นหา user ในฐานข้อมูล
      const userResult = await sql`
        SELECT id, email, name, avatar, created_at, updated_at
        FROM users
        WHERE id = ${userId}
      `;

      if (!userResult || userResult.length === 0) {
        throw new UnauthorizedException('Invalid token - user not found');
      }

      const user: User = {
        id: userResult[0].id,
        email: userResult[0].email,
        name: userResult[0].name,
        avatar: userResult[0].avatar,
        created_at: userResult[0].created_at,
        updated_at: userResult[0].updated_at,
      };

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Please Login');
    }
  }
}