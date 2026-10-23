"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class TokenService {
    static ACCESS_SECRET = process.env.JWT_SECRET || 'coper_default_jwt_secret_dev';
    static REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'coper_default_refresh_secret_dev';
    static ACCESS_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h');
    static REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.ACCESS_SECRET, {
            expiresIn: this.ACCESS_EXPIRES_IN,
        });
    }
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.REFRESH_SECRET, {
            expiresIn: this.REFRESH_EXPIRES_IN,
        });
    }
    static verifyAccessToken(token) {
        return jsonwebtoken_1.default.verify(token, this.ACCESS_SECRET);
    }
    static verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, this.REFRESH_SECRET);
    }
}
exports.TokenService = TokenService;
