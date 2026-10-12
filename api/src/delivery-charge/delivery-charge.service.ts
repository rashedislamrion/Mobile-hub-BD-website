import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDeliveryChargeTierDto,
  UpdateDeliveryChargeTierDto,
} from './dto/delivery-charge.dto';

@Injectable()
export class DeliveryChargeService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.deliveryChargeTier.findMany({
      orderBy: { minOrderQty: 'asc' },
    });
  }

  async findOne(id: string) {
    const tier = await this.prisma.deliveryChargeTier.findUnique({
      where: { id },
    });
    if (!tier) {
      throw new NotFoundException(
        `Delivery charge tier with ID ${id} not found`,
      );
    }
    return tier;
  }

  private async checkOverlap(min: number, max: number, excludeId?: string) {
    if (min >= max) {
      throw new BadRequestException(
        'Minimum order quantity must be strictly less than maximum order quantity',
      );
    }

    const existingTiers = await this.prisma.deliveryChargeTier.findMany({
      where: excludeId ? { id: { not: excludeId } } : undefined,
    });

    for (const tier of existingTiers) {
      const overlapStart = Math.max(min, tier.minOrderQty);
      const overlapEnd = Math.min(max, tier.maxOrderQty);
      if (overlapStart <= overlapEnd) {
        throw new ConflictException(
          `Tier range ${min}-${max} conflicts with existing tier ${tier.minOrderQty}-${tier.maxOrderQty}`,
        );
      }
    }
  }

  async create(dto: CreateDeliveryChargeTierDto) {
    await this.checkOverlap(dto.minOrderQty, dto.maxOrderQty);

    return this.prisma.deliveryChargeTier.create({
      data: {
        minOrderQty: dto.minOrderQty,
        maxOrderQty: dto.maxOrderQty,
        charge: dto.charge,
      },
    });
  }

  async update(id: string, dto: UpdateDeliveryChargeTierDto) {
    const existing = await this.findOne(id);
    const min =
      dto.minOrderQty !== undefined ? dto.minOrderQty : existing.minOrderQty;
    const max =
      dto.maxOrderQty !== undefined ? dto.maxOrderQty : existing.maxOrderQty;

    await this.checkOverlap(min, max, id);

    return this.prisma.deliveryChargeTier.update({
      where: { id },
      data: {
        ...(dto.minOrderQty !== undefined
          ? { minOrderQty: dto.minOrderQty }
          : {}),
        ...(dto.maxOrderQty !== undefined
          ? { maxOrderQty: dto.maxOrderQty }
          : {}),
        ...(dto.charge !== undefined ? { charge: dto.charge } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.deliveryChargeTier.delete({ where: { id } });
  }
}
