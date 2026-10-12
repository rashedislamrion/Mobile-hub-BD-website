import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/create-department.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string }) {
    const where: Prisma.DepartmentWhereInput = {};
    if (query?.search?.trim()) {
      where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }

    return this.prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            email: true,
            phone: true,
          },
        },
        _count: { select: { staff: true } },
      },
    });
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            email: true,
            phone: true,
          },
        },
        staff: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            role: { select: { id: true, name: true } },
          },
        },
        _count: { select: { staff: true } },
      },
    });
    if (!dept)
      throw new NotFoundException(`Department with ID "${id}" not found.`);
    return dept;
  }

  async create(dto: CreateDepartmentDto) {
    try {
      return await this.prisma.department.create({
        data: {
          name: dto.name,
          headId: dto.headId || null,
          status: dto.status,
        },
        include: {
          head: { select: { id: true, name: true } },
          _count: { select: { staff: true } },
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(
          `Department with name "${dto.name}" already exists.`,
        );
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    try {
      return await this.prisma.department.update({
        where: { id },
        data: {
          name: dto.name,
          headId: dto.headId !== undefined ? dto.headId || null : undefined,
          status: dto.status,
        },
        include: {
          head: { select: { id: true, name: true } },
          _count: { select: { staff: true } },
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(
          `Department with name "${dto.name}" already exists.`,
        );
      }
      throw e;
    }
  }

  async remove(id: string) {
    const dept = await this.findOne(id);
    if (dept._count.staff > 0) {
      throw new ConflictException(
        `Cannot delete department "${dept.name}" because it still has ${dept._count.staff} assigned employee(s). Please reassign them first.`,
      );
    }
    return this.prisma.department.delete({ where: { id } });
  }
}
