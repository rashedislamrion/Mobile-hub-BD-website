import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTicketIssueTypeDto,
  UpdateTicketIssueTypeDto,
} from './dto/ticket-issue-type.dto';
import { Prisma, StaffStatus } from '@prisma/client';

@Injectable()
export class TicketIssueTypeService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { status?: StaffStatus; search?: string }) {
    const where: Prisma.TicketIssueTypeWhereInput = {};
    if (query?.status) where.status = query.status;
    if (query?.search?.trim()) {
      where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }

    return this.prisma.ticketIssueType.findMany({
      where,
      include: {
        autoAssignRole: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findActive() {
    return this.prisma.ticketIssueType.findMany({
      where: { status: StaffStatus.ACTIVE },
      include: {
        autoAssignRole: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const issueType = await this.prisma.ticketIssueType.findUnique({
      where: { id },
      include: {
        autoAssignRole: { select: { id: true, name: true } },
      },
    });
    if (!issueType)
      throw new NotFoundException(
        `Ticket issue type with ID "${id}" not found.`,
      );
    return issueType;
  }

  async create(dto: CreateTicketIssueTypeDto) {
    const existing = await this.prisma.ticketIssueType.findUnique({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new ConflictException(
        `Ticket issue type "${dto.name}" already exists.`,
      );
    }

    return this.prisma.ticketIssueType.create({
      data: {
        name: dto.name.trim(),
        category: dto.category,
        autoAssignRoleId: dto.autoAssignRoleId || null,
        status: dto.status || StaffStatus.ACTIVE,
      },
      include: {
        autoAssignRole: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateTicketIssueTypeDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.ticketIssueType.findFirst({
        where: { name: dto.name.trim(), NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(
          `Ticket issue type "${dto.name}" already exists.`,
        );
      }
    }

    return this.prisma.ticketIssueType.update({
      where: { id },
      data: {
        name: dto.name ? dto.name.trim() : undefined,
        category: dto.category,
        autoAssignRoleId:
          dto.autoAssignRoleId !== undefined ? dto.autoAssignRoleId : undefined,
        status: dto.status,
      },
      include: {
        autoAssignRole: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    const count = await this.prisma.supportTicket.count({
      where: { issueTypeId: id },
    });
    if (count > 0) {
      throw new ConflictException(
        'Cannot delete issue type because support tickets are linked to it.',
      );
    }
    return this.prisma.ticketIssueType.delete({ where: { id } });
  }
}
