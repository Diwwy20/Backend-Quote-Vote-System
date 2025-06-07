import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: User | null;
}