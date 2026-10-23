import { Role } from '../../domain/enums/index.js';
export interface TokenPayload {
    userId: string;
    email: string;
    role: Role;
}
export declare class TokenService {
    private static readonly ACCESS_SECRET;
    private static readonly REFRESH_SECRET;
    private static readonly ACCESS_EXPIRES_IN;
    private static readonly REFRESH_EXPIRES_IN;
    static generateAccessToken(payload: TokenPayload): string;
    static generateRefreshToken(payload: TokenPayload): string;
    static verifyAccessToken(token: string): TokenPayload;
    static verifyRefreshToken(token: string): TokenPayload;
}
