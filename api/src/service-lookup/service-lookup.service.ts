import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeviceTypes() {
    return this.prisma.deviceType.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  async getProblemTypes() {
    return this.prisma.serviceProblemType.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  async getWarrantyPeriods() {
    return this.prisma.serviceWarrantyPeriod.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { days: 'asc' },
    });
  }
}
