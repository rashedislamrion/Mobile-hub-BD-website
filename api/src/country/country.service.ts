import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCountryDto, UpdateCountryDto } from './dto/country.dto';
import { Prisma, StaffStatus } from '@prisma/client';

@Injectable()
export class CountryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { status?: StaffStatus; search?: string }) {
    const where: Prisma.CountryWhereInput = {};
    if (query?.status) where.status = query.status;
    if (query?.search?.trim()) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { code: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    return this.prisma.country.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const country = await this.prisma.country.findUnique({ where: { id } });
    if (!country)
      throw new NotFoundException(`Country with ID "${id}" not found.`);
    return country;
  }

  async create(dto: CreateCountryDto) {
    const existing = await this.prisma.country.findUnique({
      where: { name: dto.name.trim() },
    });
    if (existing)
      throw new ConflictException(`Country "${dto.name}" already exists.`);

    return this.prisma.country.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        currency: dto.currency.trim().toUpperCase(),
        status: dto.status || StaffStatus.ACTIVE,
      },
    });
  }

  async update(id: string, dto: UpdateCountryDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.country.findFirst({
        where: { name: dto.name.trim(), NOT: { id } },
      });
      if (existing)
        throw new ConflictException(`Country "${dto.name}" already exists.`);
    }

    return this.prisma.country.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        code: dto.code ? dto.code.trim().toUpperCase() : undefined,
        currency: dto.currency ? dto.currency.trim().toUpperCase() : undefined,
        status: dto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.country.delete({ where: { id } });
  }
}
