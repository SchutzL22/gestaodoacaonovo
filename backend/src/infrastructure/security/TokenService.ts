import jwt from 'jsonwebtoken';
import { Role } from '../../domain/enums/index.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export class TokenService {
  private static readonly ACCESS_SECRET = process.env.JWT_SECRET || 'coper_default_jwt_secret_dev';
  private static readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'coper_default_refresh_secret_dev';
  private static readonly ACCESS_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn'];
  private static readonly REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.ACCESS_SECRET, {
      expiresIn: this.ACCESS_EXPIRES_IN,
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRES_IN,
    });
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.ACCESS_SECRET) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.REFRESH_SECRET) as TokenPayload;
  }
}
