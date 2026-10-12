import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSupportTicketDto,
  CreateTicketMessageDto,
  UpdateTicketStatusDto,
} from './dto/support-ticket.dto';
import {
  Prisma,
  SenderType,
  StaffStatus,
  TicketStatus,
  ModuleName,
  PermissionAction,
} from '@prisma/client';

@Injectable()
export class SupportTicketService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupportTicketDto, customerId: string) {
    const issueType = await this.prisma.ticketIssueType.findUnique({
      where: { id: dto.issueTypeId },
    });
    if (!issueType) {
      throw new NotFoundException('Selected issue type does not exist.');
    }

    // Auto-assign staff if issueType has autoAssignRoleId
    let assignedToId: string | null = null;
    if (issueType.autoAssignRoleId) {
      const staff = await this.prisma.staff.findFirst({
        where: {
          roleId: issueType.autoAssignRoleId,
          status: StaffStatus.ACTIVE,
        },
      });
      if (staff) {
        assignedToId = staff.id;
      }
    }

    const ticketCode = `TCK-${Math.floor(100000 + Math.random() * 900000)}`;

    return this.prisma.supportTicket.create({
      data: {
        ticketCode,
        customerId,
        orderId: dto.orderId || null,
        issueTypeId: dto.issueTypeId,
        subject: dto.subject,
        description: dto.description,
        status: TicketStatus.RUNNING,
        assignedToId,
        messages: {
          create: {
            senderType: SenderType.CUSTOMER,
            senderId: customerId,
            message: dto.description,
          },
        },
      },
      include: {
        issueType: true,
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        assignedTo: { select: { id: true, name: true, employeeId: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async findMyTickets(customerId: string, status?: TicketStatus) {
    const where: Prisma.SupportTicketWhereInput = { customerId };
    if (status) where.status = status;

    return this.prisma.supportTicket.findMany({
      where,
      include: {
        issueType: true,
        order: { select: { id: true, orderCode: true, totalAmount: true } },
        assignedTo: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(query?: {
    status?: TicketStatus;
    issueTypeId?: string;
    assignedToId?: string;
    search?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {};
    if (query?.status) where.status = query.status;
    if (query?.issueTypeId) where.issueTypeId = query.issueTypeId;
    if (query?.assignedToId) where.assignedToId = query.assignedToId;

    let orderBy: Prisma.SupportTicketOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    if (query?.sortBy) {
      const s = query.sortBy.toLowerCase();
      if (s === 'newest') {
        orderBy = { createdAt: 'desc' };
      } else if (s === 'oldest') {
        orderBy = { createdAt: 'asc' };
      } else if (s === 'pending') {
        where.status = TicketStatus.RUNNING;
      } else if (s === 'completed') {
        where.status = TicketStatus.COMPLETED;
      }
    }

    if (query?.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { ticketCode: { contains: term, mode: 'insensitive' } },
        { subject: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
        { customer: { phone: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        include: {
          issueType: true,
          order: { select: { id: true, orderCode: true } },
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          assignedTo: { select: { id: true, name: true, employeeId: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const mapped = data.map((t) => {
      let statusLabel = 'Confirm';
      if (t.status === TicketStatus.COMPLETED) statusLabel = 'Completed';
      else if (t.status === TicketStatus.CANCELLED) statusLabel = 'Cancelled';
      else if (t.status === TicketStatus.RUNNING) statusLabel = 'Confirm';

      const orderNumber = t.order?.orderCode || t.orderId || '-';

      return {
        ...t,
        orderNumber,
        statusLabel,
      };
    });

    return {
      data: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user?: { sub: string; userType: string }) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        issueType: true,
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        order: {
          select: {
            id: true,
            orderCode: true,
            totalAmount: true,
            status: true,
          },
        },
        assignedTo: { select: { id: true, name: true, employeeId: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket)
      throw new NotFoundException(`Support ticket with ID "${id}" not found.`);

    if (user?.userType === 'CUSTOMER') {
      if (ticket.customerId !== user.sub) {
        throw new ForbiddenException(
          'You do not have permission to view this ticket.',
        );
      }
    } else if (user?.userType === 'STAFF') {
      if ((user as any).roleId) {
        const perm = await this.prisma.rolePermission.findUnique({
          where: {
            roleId_module_action: {
              roleId: (user as any).roleId,
              module: ModuleName.HELP_REQUESTS,
              action: PermissionAction.READ,
            },
          },
        });
        if (!perm?.allowed) {
          throw new ForbiddenException(
            'Your role does not have READ permission on HELP_REQUESTS.',
          );
        }
      }
    } else {
      throw new ForbiddenException('Authentication required to view support ticket.');
    }

    return ticket;
  }

  async addMessage(
    ticketId: string,
    dto: CreateTicketMessageDto,
    user: { sub: string; userType: string },
  ) {
    const ticket = await this.findOne(ticketId, user);

    const senderType =
      user.userType === 'CUSTOMER' ? SenderType.CUSTOMER : SenderType.STAFF;

    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticketId,
        senderType,
        senderId: user.sub,
        message: dto.message,
      },
    });

    return message;
  }

  async updateStatus(id: string, dto: UpdateTicketStatusDto) {
    await this.findOne(id);
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: dto.status,
        assignedToId:
          dto.assignedToId !== undefined ? dto.assignedToId || null : undefined,
      },
      include: {
        issueType: true,
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        assignedTo: { select: { id: true, name: true, employeeId: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.supportTicket.delete({ where: { id } });
  }
}
