import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePushNotificationDto } from './dto/push-notification.dto';
import { NotificationStatus, NotificationTarget, Prisma } from '@prisma/client';

@Injectable()
export class PushNotificationService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    targetAudience?: NotificationTarget;
    search?: string;
  }) {
    const where: Prisma.PushNotificationWhereInput = {};
    if (query?.targetAudience) where.targetAudience = query.targetAudience;
    if (query?.search?.trim()) {
      where.title = { contains: query.search.trim(), mode: 'insensitive' };
    }

    return this.prisma.pushNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const notification = await this.prisma.pushNotification.findUnique({
      where: { id },
    });
    if (!notification)
      throw new NotFoundException(`Notification with ID "${id}" not found.`);
    return notification;
  }

  async create(dto: CreatePushNotificationDto) {
    let status: NotificationStatus = NotificationStatus.DRAFT;
    let deliveredCount: number | null = null;

    if (dto.sendOption === 'now') {
      status = NotificationStatus.SENT;
      // In MVP without active Firebase keys, simulate deliveredCount
      const totalCustomers = await this.prisma.customer.count();
      deliveredCount = Math.max(1, totalCustomers);
    } else if (dto.sendOption === 'scheduled' && dto.scheduledAt) {
      status = NotificationStatus.SCHEDULED;
    }

    return this.prisma.pushNotification.create({
      data: {
        title: dto.title,
        message: dto.message,
        targetAudience: dto.targetAudience || NotificationTarget.ALL_CUSTOMERS,
        linkUrl: dto.linkUrl || null,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: dto.status || status,
        deliveredCount,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.pushNotification.delete({ where: { id } });
  }
}
