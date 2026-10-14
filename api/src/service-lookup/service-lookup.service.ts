import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class ServiceLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeviceTypes() {
    let list = await this.prisma.deviceType.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });

    if (list.length === 0) {
      const defaultTypes = [
        'Phone',
        'Tablet',
        'Laptop',
        'Smart Watch',
        'Desktop',
        'Audio & Accessories',
      ];
      for (const name of defaultTypes) {
        await this.prisma.deviceType.upsert({
          where: { name },
          create: { name, status: 'ACTIVE' },
          update: {},
        });
      }
      list = await this.prisma.deviceType.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      });
    }

    return list;
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

  async getTechnicians(user?: JwtPayload) {
    const where: any = {
      status: 'ACTIVE',
      OR: [
        { isTechnician: true },
        { role: { name: { contains: 'technician', mode: 'insensitive' } } },
      ],
    };

    // If staff user is assigned to a specific branch, scope technician list to that branch
    if (user?.branchId) {
      where.AND = [
        {
          OR: [
            { branchId: user.branchId },
            { branchAccess: { some: { branchId: user.branchId } } },
            { branchId: null },
          ],
        },
      ];
    }

    return this.prisma.staff.findMany({
      where,
      select: {
        id: true,
        name: true,
        employeeId: true,
        phone: true,
        branchId: true,
        isTechnician: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getSuppliers() {
    return this.prisma.supplier.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        phone: true,
        companyName: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getModels(brandId?: string) {
    return this.prisma.series.findMany({
      where: {
        status: 'ACTIVE',
        ...(brandId ? { brandId } : {}),
      },
      select: {
        id: true,
        name: true,
        brandId: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
