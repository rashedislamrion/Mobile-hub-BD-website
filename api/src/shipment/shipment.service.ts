import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import { Prisma, ShipmentStatus } from '@prisma/client';

@Injectable()
export class ShipmentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    courierPartner?: string;
    status?: ShipmentStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ShipmentWhereInput = {};

    if (query.courierPartner) where.courierPartner = query.courierPartner;
    if (query.status) where.status = query.status;

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { trackingNo: { contains: s, mode: 'insensitive' } },
        { courierPartner: { contains: s, mode: 'insensitive' } },
        { order: { orderCode: { contains: s, mode: 'insensitive' } } },
        { order: { customer: { name: { contains: s, mode: 'insensitive' } } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastUpdated: 'desc' },
        include: {
          order: {
            include: {
              customer: { select: { id: true, name: true, phone: true } },
              branch: { select: { id: true, name: true } },
            },
          },
        },
      }),
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
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            branch: true,
            items: true,
          },
        },
      },
    });
    if (!shipment) throw new NotFoundException(`Shipment "${id}" not found.`);
    return shipment;
  }

  async create(dto: CreateShipmentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order)
      throw new NotFoundException(`Order "${dto.orderId}" not found.`);

    const existingTracking = await this.prisma.shipment.findUnique({
      where: { trackingNo: dto.trackingNo },
    });
    if (existingTracking)
      throw new ConflictException(
        `Tracking number "${dto.trackingNo}" is already in use.`,
      );

    return this.prisma.shipment.create({
      data: {
        orderId: dto.orderId,
        courierPartner: dto.courierPartner,
        trackingNo: dto.trackingNo,
        address: dto.address,
        status: ShipmentStatus.PENDING_PICKUP,
      },
      include: { order: true },
    });
  }

  async updateStatus(id: string, dto: UpdateShipmentStatusDto) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException(`Shipment "${id}" not found.`);

    return this.prisma.shipment.update({
      where: { id },
      data: { status: dto.status },
      include: { order: true },
    });
  }
}
