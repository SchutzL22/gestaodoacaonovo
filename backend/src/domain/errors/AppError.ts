export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = 'Não autorizado. Faça login para continuar.'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Acesso negado. Você não possui permissão para este recurso.'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message = 'Recurso não encontrado.'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static unprocessable(message: string, details?: unknown): AppError {
    return new AppError(message, 422, details);
  }

  static internal(message = 'Erro interno do servidor.'): AppError {
    return new AppError(message, 500);
  }
}
