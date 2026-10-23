export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly details?: unknown;
    constructor(message: string, statusCode?: number, details?: unknown);
    static badRequest(message: string, details?: unknown): AppError;
    static unauthorized(message?: string): AppError;
    static forbidden(message?: string): AppError;
    static notFound(message?: string): AppError;
    static conflict(message: string): AppError;
    static unprocessable(message: string, details?: unknown): AppError;
    static internal(message?: string): AppError;
}
