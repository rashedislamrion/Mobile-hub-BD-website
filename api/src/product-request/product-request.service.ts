import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductRequestDto } from './dto/create-product-request.dto';
import {
  ApproveProductRequestDto,
  RejectProductRequestDto,
} from './dto/update-product-request.dto';
import { Prisma, ProductRequestStatus, ProductStatus } from '@prisma/client';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class ProductRequestService {
  constructor(private prisma: PrismaService) {}

  private async getNextRequestNumber(): Promise<string> {
    const count = await this.prisma.productRequest.count();
    const nextNum = count + 1;
    return `PR-${String(nextNum).padStart(4, '0')}`;
  }

  async findAll(
    user: JwtPayload,
    query: {
      search?: string;
      status?: ProductRequestStatus;
      type?: 'SENT' | 'RECEIVED';
      branchId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const userBranchId = user.branchId;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const andConditions: Prisma.ProductRequestWhereInput[] = [];

    // Type filter or base scope filter
    if (userBranchId) {
      if (query.type === 'SENT') {
        andConditions.push({ requestingBranchId: userBranchId });
      } else if (query.type === 'RECEIVED') {
        andConditions.push({ fulfillingBranchId: userBranchId });
      } else {
        andConditions.push({
          OR: [
            { requestingBranchId: userBranchId },
            { fulfillingBranchId: userBranchId },
          ],
        });
      }
    }

    // Status filter
    if (query.status) {
      andConditions.push({ status: query.status });
    }

    // Other Branch filter
    if (query.branchId && query.branchId !== 'ALL') {
      if (query.type === 'SENT') {
        andConditions.push({ fulfillingBranchId: query.branchId });
      } else if (query.type === 'RECEIVED') {
        andConditions.push({ requestingBranchId: query.branchId });
      } else {
        andConditions.push({
          OR: [
            { fulfillingBranchId: query.branchId },
            { requestingBranchId: query.branchId },
          ],
        });
      }
    }

    // Search query
    if (query.search?.trim()) {
      const s = query.search.trim();
      andConditions.push({
        OR: [
          { requestNumber: { contains: s, mode: 'insensitive' } },
          { note: { contains: s, mode: 'insensitive' } },
          { decisionNote: { contains: s, mode: 'insensitive' } },
          { requestingBranch: { name: { contains: s, mode: 'insensitive' } } },
          { fulfillingBranch: { name: { contains: s, mode: 'insensitive' } } },
        ],
      });
    }

    const where: Prisma.ProductRequestWhereInput = { AND: andConditions };

    const [total, data] = await Promise.all([
      this.prisma.productRequest.count({ where }),
      this.prisma.productRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requestingBranch: {
            select: { id: true, name: true, code: true, city: true },
          },
          fulfillingBranch: {
            select: { id: true, name: true, code: true, city: true },
          },
          requestedByUser: { select: { id: true, name: true, phone: true } },
          approvedByUser: { select: { id: true, name: true } },
          updatedByUser: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, code: true } },
              productVariant: {
                select: { id: true, color: true, quality: true, sku: true },
              },
            },
          },
        },
      }),
    ]);

    const mappedData = data.map((req) => {
      const itemsCount = req.items.length;
      const totalQuantity = req.items.reduce(
        (sum, item) => sum + (item.requestedQty || 0),
        0,
      );
      const approvedQuantity = req.items.reduce(
        (sum, item) => sum + (item.approvedQty || 0),
        0,
      );
      return {
        ...req,
        itemsCount,
        totalQuantity,
        approvedQuantity,
      };
    });

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string, user: JwtPayload) {
    const userBranchId = user.branchId;

    const request = await this.prisma.productRequest.findUnique({
      where: { id },
      include: {
        requestingBranch: true,
        fulfillingBranch: true,
        requestedByUser: {
          select: { id: true, name: true, phone: true, email: true },
        },
        approvedByUser: {
          select: { id: true, name: true, phone: true, email: true },
        },
        updatedByUser: {
          select: { id: true, name: true, phone: true, email: true },
        },
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                category: { select: { id: true, name: true } },
                brand: { select: { id: true, name: true } },
              },
            },
            productVariant: {
              include: {
                branchInventories: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Product request "${id}" not found.`);
    }

    // RBAC: Check that requesting user's branch is either requestingBranch or fulfillingBranch (for branch-scoped users)
    if (
      userBranchId &&
      request.requestingBranchId !== userBranchId &&
      request.fulfillingBranchId !== userBranchId
    ) {
      throw new ForbiddenException(
        'Access denied: You can only view requests involving your own branch.',
      );
    }

    // Attach fulfilling branch stock to each item for reference
    const itemsWithLiveStock = request.items.map((item) => {
      const fulfillingStock =
        item.productVariant.branchInventories.find(
          (inv) => inv.branchId === request.fulfillingBranchId,
        )?.quantity || 0;
      return {
        ...item,
        fulfillingStock,
      };
    });

    return {
      ...request,
      items: itemsWithLiveStock,
    };
  }

  async create(dto: CreateProductRequestDto, user: JwtPayload) {
    const userBranchId = user.branchId;
    if (!userBranchId) {
      throw new BadRequestException(
        'User must be assigned to a branch to create a product request.',
      );
    }

    if (dto.fulfillingBranchId === userBranchId) {
      throw new BadRequestException(
        'Fulfilling branch cannot be your own branch.',
      );
    }

    const fulfillingBranch = await this.prisma.branch.findUnique({
      where: { id: dto.fulfillingBranchId },
    });
    if (!fulfillingBranch) {
      throw new NotFoundException(
        `Fulfilling branch "${dto.fulfillingBranchId}" not found.`,
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'At least one product item must be requested.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const requestNumber = await this.getNextRequestNumber();

      const request = await tx.productRequest.create({
        data: {
          requestNumber,
          requestingBranchId: userBranchId,
          fulfillingBranchId: dto.fulfillingBranchId,
          status: ProductRequestStatus.PENDING,
          requestedByUserId: user.sub,
          note: dto.note?.trim() || null,
        },
      });

      for (const item of dto.items) {
        if (
          !item.productId ||
          !item.productVariantId ||
          item.requestedQty <= 0
        ) {
          throw new BadRequestException(
            'Each item must specify valid product, variant, and quantity >= 1.',
          );
        }

        await tx.productRequestItem.create({
          data: {
            productRequestId: request.id,
            productId: item.productId,
            productVariantId: item.productVariantId,
            requestedQty: item.requestedQty,
            approvedQty: item.requestedQty, // defaults to requestedQty
          },
        });
      }

      return tx.productRequest.findUnique({
        where: { id: request.id },
        include: {
          requestingBranch: true,
          fulfillingBranch: true,
          requestedByUser: { select: { id: true, name: true } },
          items: {
            include: {
              product: true,
              productVariant: true,
            },
          },
        },
      });
    });
  }

  async approve(id: string, dto: ApproveProductRequestDto, user: JwtPayload) {
    const userBranchId = user.branchId;
    if (!userBranchId) {
      throw new ForbiddenException('User must belong to a branch.');
    }

    const request = await this.prisma.productRequest.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!request) {
      throw new NotFoundException(`Product request "${id}" not found.`);
    }

    // Security check: Only fulfilling branch can approve
    if (request.fulfillingBranchId !== userBranchId) {
      throw new ForbiddenException(
        'Access denied: Only the fulfilling branch can approve this request.',
      );
    }

    if (request.status !== ProductRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve request with status "${request.status}". Only PENDING requests can be approved.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.items && dto.items.length > 0) {
        for (const itemDto of dto.items) {
          const item = request.items.find((i) => i.id === itemDto.itemId);
          if (!item) {
            throw new BadRequestException(
              `Item "${itemDto.itemId}" not found on request.`,
            );
          }
          if (itemDto.approvedQty < 0) {
            throw new BadRequestException(
              `Approved quantity cannot be negative for item "${item.id}".`,
            );
          }
          if (itemDto.approvedQty > item.requestedQty) {
            throw new BadRequestException(
              `Approved quantity (${itemDto.approvedQty}) cannot exceed requested quantity (${item.requestedQty}) for item "${item.id}".`,
            );
          }

          await tx.productRequestItem.update({
            where: { id: item.id },
            data: { approvedQty: itemDto.approvedQty },
          });
        }
      }

      return tx.productRequest.update({
        where: { id },
        data: {
          status: ProductRequestStatus.APPROVED,
          approvedByUserId: user.sub,
          approvalDate: new Date(),
          updatedByUserId: user.sub,
          decisionNote: dto.decisionNote?.trim() || null,
        },
        include: {
          requestingBranch: true,
          fulfillingBranch: true,
          items: true,
        },
      });
    });
  }

  async reject(id: string, dto: RejectProductRequestDto, user: JwtPayload) {
    const userBranchId = user.branchId;
    if (!userBranchId) {
      throw new ForbiddenException('User must belong to a branch.');
    }

    const request = await this.prisma.productRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Product request "${id}" not found.`);
    }

    // Security check: Only fulfilling branch can reject
    if (request.fulfillingBranchId !== userBranchId) {
      throw new ForbiddenException(
        'Access denied: Only the fulfilling branch can reject this request.',
      );
    }

    if (request.status !== ProductRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject request with status "${request.status}". Only PENDING requests can be rejected.`,
      );
    }

    return this.prisma.productRequest.update({
      where: { id },
      data: {
        status: ProductRequestStatus.REJECTED,
        updatedByUserId: user.sub,
        decisionNote: dto.decisionNote?.trim() || null,
      },
      include: {
        requestingBranch: true,
        fulfillingBranch: true,
        items: true,
      },
    });
  }

  async complete(id: string, user: JwtPayload) {
    const userBranchId = user.branchId;
    if (!userBranchId) {
      throw new ForbiddenException('User must belong to a branch.');
    }

    const request = await this.prisma.productRequest.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });
    if (!request) {
      throw new NotFoundException(`Product request "${id}" not found.`);
    }

    // Security check: Only requesting branch can complete the transfer upon receipt
    if (request.requestingBranchId !== userBranchId) {
      throw new ForbiddenException(
        'Access denied: Only the requesting branch can confirm and complete physical stock transfer.',
      );
    }

    if (request.status !== ProductRequestStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot complete transfer for request with status "${request.status}". Request must be APPROVED.`,
      );
    }

    // Atomic transaction for real stock movement
    return this.prisma.$transaction(async (tx) => {
      for (const item of request.items) {
        const approvedQty = item.approvedQty;
        if (approvedQty <= 0) continue;

        // Check fulfilling branch stock live inside transaction
        const fulfillingInv = await tx.branchInventory.findUnique({
          where: {
            branchId_productVariantId: {
              branchId: request.fulfillingBranchId,
              productVariantId: item.productVariantId,
            },
          },
        });

        const currentStock = fulfillingInv?.quantity || 0;
        if (currentStock < approvedQty) {
          throw new BadRequestException(
            `Insufficient stock at fulfilling branch for "${item.product.name}" (${item.productVariant.color || ''} ${item.productVariant.quality || ''}). Required: ${approvedQty}, Available in stock: ${currentStock}. Transfer blocked to prevent negative inventory.`,
          );
        }

        // Decrement fulfilling branch inventory
        await tx.branchInventory.update({
          where: {
            branchId_productVariantId: {
              branchId: request.fulfillingBranchId,
              productVariantId: item.productVariantId,
            },
          },
          data: {
            quantity: { decrement: approvedQty },
          },
        });

        // Increment requesting branch inventory (upsert)
        await tx.branchInventory.upsert({
          where: {
            branchId_productVariantId: {
              branchId: request.requestingBranchId,
              productVariantId: item.productVariantId,
            },
          },
          create: {
            branchId: request.requestingBranchId,
            productVariantId: item.productVariantId,
            quantity: approvedQty,
          },
          update: {
            quantity: { increment: approvedQty },
          },
        });
      }

      // Mark request as COMPLETED
      return tx.productRequest.update({
        where: { id },
        data: {
          status: ProductRequestStatus.COMPLETED,
          updatedByUserId: user.sub,
        },
        include: {
          requestingBranch: true,
          fulfillingBranch: true,
          items: true,
        },
      });
    });
  }

  async getCatalog(query: {
    branchId: string;
    search?: string;
    categoryId?: string;
  }) {
    if (!query.branchId) {
      throw new BadRequestException(
        'Fulfilling branchId is required to check live stock.',
      );
    }

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
    };

    if (query.categoryId && query.categoryId !== 'ALL') {
      where.categoryId = query.categoryId;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { brand: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      take: 50,
      orderBy: { name: 'asc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
        variants: {
          include: {
            branchInventories: {
              where: { branchId: query.branchId },
            },
          },
        },
      },
    });

    return products.map((prod) => {
      const variantsWithStock = prod.variants.map((v) => {
        const branchStock = v.branchInventories[0]?.quantity || 0;
        return {
          id: v.id,
          productId: v.productId,
          color: v.color,
          quality: v.quality,
          price: Number(v.price),
          sku: v.sku,
          branchStock,
        };
      });

      const totalBranchStock = variantsWithStock.reduce(
        (acc, v) => acc + v.branchStock,
        0,
      );

      return {
        id: prod.id,
        name: prod.name,
        code: prod.code,
        category: prod.category,
        brand: prod.brand,
        image: prod.images[0]?.url || null,
        regularPrice: Number(prod.regularPrice),
        variants: variantsWithStock,
        totalBranchStock,
      };
    });
  }
}
