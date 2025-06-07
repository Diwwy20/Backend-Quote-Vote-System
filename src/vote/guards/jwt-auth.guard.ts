import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
// import { User } from '../interfaces/auth.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Access token is required (Bearer token)');
      }

      const token = authHeader.split(' ')[1];

      // เรียก external API เพื่อตรวจสอบ token และดึงข้อมูล user
      const userUrl = this.configService.get('USER_URL');
      const response = await firstValueFrom(
        this.httpService.get(`${userUrl}/api/auth/user`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
      );

      // ตั้ง user ใน request object
      request.user = response.data;
      return true;

    } catch (error: any) {
      console.log("Error: ", error.message);
      throw new UnauthorizedException('Please Login');
    }
  }
}