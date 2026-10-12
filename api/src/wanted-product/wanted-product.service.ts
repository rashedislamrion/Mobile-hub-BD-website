import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWantedProductDto } from './dto/create-wanted-product.dto';
import { UpdateWantedProductDto } from './dto/update-wanted-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class WantedProductService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.WantedProductWhereInput = {};

    if (query.status && query.status !== 'all') {
      where.status = { equals: query.status, mode: 'insensitive' };
    }

    if (query.dateFrom || query.dateTo) {
      where.requestedDate = {};
      if (query.dateFrom) {
        where.requestedDate.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        where.requestedDate.lte = to;
      }
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.wantedProduct.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedDate: 'desc' },
      }),
      this.prisma.wantedProduct.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.wantedProduct.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(
        `Wanted product request with ID ${id} not found`,
      );
    }
    return item;
  }

  async create(dto: CreateWantedProductDto) {
    return this.prisma.wantedProduct.create({
      data: {
        productName: dto.productName.trim(),
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone.trim(),
        notes: dto.notes ? dto.notes.trim() : null,
        status: (dto.status || 'NEW').toUpperCase(),
      },
    });
  }

  async update(id: string, dto: UpdateWantedProductDto) {
    await this.findOne(id);

    return this.prisma.wantedProduct.update({
      where: { id },
      data: {
        productName:
          dto.productName !== undefined ? dto.productName.trim() : undefined,
        customerName:
          dto.customerName !== undefined ? dto.customerName.trim() : undefined,
        customerPhone:
          dto.customerPhone !== undefined
            ? dto.customerPhone.trim()
            : undefined,
        notes: dto.notes !== undefined ? dto.notes?.trim() : undefined,
        status: dto.status !== undefined ? dto.status.toUpperCase() : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.wantedProduct.delete({
      where: { id },
    });
  }
}
