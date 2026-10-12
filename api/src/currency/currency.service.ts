import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyDto, UpdateCurrencyDto } from './dto/currency.dto';

@Injectable()
export class CurrencyService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultCurrency();
  }

  async seedDefaultCurrency() {
    const count = await this.prisma.currency.count();
    if (count === 0) {
      await this.prisma.currency.create({
        data: {
          name: 'BDT',
          symbol: '৳',
          rate: 1,
          isDefault: true,
        },
      });
    } else {
      const hasDefault = await this.prisma.currency.findFirst({
        where: { isDefault: true },
      });
      if (!hasDefault) {
        const bdt = await this.prisma.currency.findFirst({
          where: { name: 'BDT' },
        });
        if (bdt) {
          await this.prisma.currency.update({
            where: { id: bdt.id },
            data: { isDefault: true, rate: 1 },
          });
        } else {
          const first = await this.prisma.currency.findFirst();
          if (first) {
            await this.prisma.currency.update({
              where: { id: first.id },
              data: { isDefault: true },
            });
          }
        }
      }
    }
  }

  async findAll() {
    return this.prisma.currency.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
    return currency;
  }

  async create(dto: CreateCurrencyDto) {
    const existing = await this.prisma.currency.findUnique({
      where: { name: dto.name.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Currency ${dto.name} already exists`);
    }

    if (dto.isDefault) {
      await this.prisma.currency.updateMany({
        data: { isDefault: false },
      });
    }

    return this.prisma.currency.create({
      data: {
        name: dto.name.toUpperCase(),
        symbol: dto.symbol,
        rate: dto.name.toUpperCase() === 'BDT' ? 1 : dto.rate,
        isDefault: !!dto.isDefault,
      },
    });
  }

  async update(id: string, dto: UpdateCurrencyDto) {
    const currency = await this.findOne(id);

    if (dto.name && dto.name.toUpperCase() !== currency.name) {
      const existing = await this.prisma.currency.findUnique({
        where: { name: dto.name.toUpperCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Currency ${dto.name} already exists`);
      }
    }

    if (dto.isDefault === false && currency.isDefault) {
      const defaultCount = await this.prisma.currency.count({
        where: { isDefault: true },
      });
      if (defaultCount <= 1) {
        throw new BadRequestException(
          'Cannot unset the only default currency. Set another currency as default instead.',
        );
      }
    }

    if (dto.isDefault === true) {
      await this.prisma.currency.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    const newName = dto.name ? dto.name.toUpperCase() : currency.name;
    const newRate =
      newName === 'BDT' ? 1 : dto.rate !== undefined ? dto.rate : currency.rate;

    return this.prisma.currency.update({
      where: { id },
      data: {
        ...(dto.name ? { name: newName } : {}),
        ...(dto.symbol ? { symbol: dto.symbol } : {}),
        rate: newRate,
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      },
    });
  }

  async remove(id: string) {
    const currency = await this.findOne(id);
    if (currency.isDefault) {
      throw new BadRequestException(
        'Cannot delete default currency. Please mark another currency as default first.',
      );
    }
    if (currency.name === 'BDT') {
      throw new BadRequestException(
        'Primary system currency BDT cannot be deleted.',
      );
    }

    return this.prisma.currency.delete({ where: { id } });
  }
}
