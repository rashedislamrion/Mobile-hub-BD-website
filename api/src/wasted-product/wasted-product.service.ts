import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWastedProductDto } from './dto/create-wasted-product.dto';
import { UpdateWastedProductDto } from './dto/update-wasted-product.dto';
import { Prisma, StockAdjustmentType } from '@prisma/client';

@Injectable()
export class WastedProductService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    search?: string;
    branchId?: string;
    reason?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.WastedProductWhereInput = {};

    if (query.branchId && query.branchId !== 'all') {
      if (query.branchId === 'null' || query.branchId === 'na') {
        where.branchId = null;
      } else {
        where.branchId = query.branchId;
      }
    }

    if (query.reason && query.reason !== 'all') {
      where.reason = { equals: query.reason, mode: 'insensitive' };
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { code: { contains: search, mode: 'insensitive' } } },
        { variant: { sku: { contains: search, mode: 'insensitive' } } },
        { note: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.wastedProduct.count({ where }),
      this.prisma.wastedProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              category: { select: { id: true, name: true } },
            },
          },
          variant: true,
          branch: { select: { id: true, name: true, code: true } },
          reportedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.wastedProduct.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            category: true,
          },
        },
        variant: true,
        branch: true,
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!item) {
      throw new NotFoundException(`Wasted product with ID "${id}" not found`);
    }

    return item;
  }

  async create(dto: CreateWastedProductDto, staffId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID "${dto.productId}" not found`,
      );
    }

    let targetVariant: any = null;
    if (dto.variantId) {
      targetVariant = product.variants.find((v) => v.id === dto.variantId);
      if (!targetVariant) {
        throw new NotFoundException(
          `Product variant with ID "${dto.variantId}" not found`,
        );
      }
    } else if (product.variants.length === 1) {
      targetVariant = product.variants[0];
    }

    if (targetVariant) {
      if (targetVariant.stock < dto.quantity) {
        throw new ConflictException(
          `Insufficient variant stock. SKU "${targetVariant.sku}" only has ${targetVariant.stock} units available, requested write-off: ${dto.quantity}.`,
        );
      }
    }

    const unitPrice = targetVariant
      ? Number(targetVariant.price)
      : Number(product.costPrice || product.regularPrice);
    const calculatedCost =
      dto.costImpact !== undefined
        ? new Prisma.Decimal(dto.costImpact)
        : new Prisma.Decimal(unitPrice * dto.quantity);

    return this.prisma.$transaction(async (tx) => {
      const wasted = await tx.wastedProduct.create({
        data: {
          productId: dto.productId,
          variantId: targetVariant ? targetVariant.id : dto.variantId || null,
          branchId:
            dto.branchId && dto.branchId !== 'null' && dto.branchId !== ''
              ? dto.branchId
              : null,
          quantity: dto.quantity,
          reason: dto.reason.toUpperCase(),
          note: dto.note || null,
          costImpact: calculatedCost,
          reportedById: staffId,
        },
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
          variant: true,
          branch: true,
        },
      });

      if (targetVariant) {
        const stockBefore = targetVariant.stock;
        const stockAfter = targetVariant.stock - dto.quantity;

        await tx.productVariant.update({
          where: { id: targetVariant.id },
          data: { stock: stockAfter },
        });

        if (wasted.branchId) {
          const refNo = `SA-WST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
          await tx.stockAdjustment.create({
            data: {
              referenceNo: refNo,
              productId: dto.productId,
              variantId: targetVariant.id,
              branchId: wasted.branchId,
              type: StockAdjustmentType.DECREASE,
              quantityChange: -dto.quantity,
              stockBefore,
              stockAfter,
              reason: `Wasted Product: ${dto.reason.toUpperCase()}${dto.note ? ` (${dto.note})` : ''}`,
              adjustedById: staffId,
            },
          });
        }
      }

      return wasted;
    });
  }

  async update(id: string, dto: UpdateWastedProductDto) {
    await this.findOne(id);

    const data: Prisma.WastedProductUpdateInput = {};
    if (dto.reason !== undefined) data.reason = dto.reason.toUpperCase();
    if (dto.note !== undefined) data.note = dto.note || null;
    if (dto.costImpact !== undefined)
      data.costImpact = new Prisma.Decimal(dto.costImpact);

    return this.prisma.wastedProduct.update({
      where: { id },
      data,
      include: {
        product: true,
        variant: true,
        branch: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.wastedProduct.delete({
      where: { id },
    });
  }
}
