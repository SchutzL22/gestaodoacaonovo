import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../../domain/errors/AppError.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // AppError conhecido / operacional
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Erros de validação Zod
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Falha na validação dos dados de entrada.',
      details: formattedErrors,
    });
    return;
  }

  // Erros conhecidos do Prisma ORM
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['campo'];
      res.status(409).json({
        status: 'error',
        statusCode: 409,
        message: `Conflito de unicidade: já existe um registro com esse ${target.join(', ')}.`,
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Registro não encontrado no banco de dados.',
      });
      return;
    }
  }

  console.error('[UnhandledError]', err);

  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: 'Ocorreu um erro interno inesperado no servidor.',
  });
}
