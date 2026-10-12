import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientUnknownRequestError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const msg = exception.message || '';
    const isStockCheckViolation =
      msg.includes('chk_product_variant_stock_non_negative') ||
      msg.includes('chk_branch_inventory_quantity_non_negative') ||
      msg.includes('violates check constraint') ||
      msg.includes('23514') ||
      (exception instanceof Prisma.PrismaClientKnownRequestError &&
        exception.code === 'P2004' &&
        (msg.includes('stock') || msg.includes('quantity')));

    if (isStockCheckViolation) {
      this.logger.warn(`Stock constraint violation intercepted: ${msg}`);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Insufficient stock available to complete this transaction.',
        error: 'Bad Request',
      });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        const target = (exception.meta?.target as string[]) || [];
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: `Unique constraint violation on field: ${target.join(', ')}`,
          error: 'Conflict',
        });
      }

      if (exception.code === 'P2025') {
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found.',
          error: 'Not Found',
        });
      }
    }

    // Default to internal server error for other uncaught Prisma errors
    const errCode = (exception as any).code || 'UNKNOWN';
    this.logger.error(`Prisma error ${errCode}: ${exception.message}`);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal database error',
      error: 'Internal Server Error',
    });
  }
}
