import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContactSubmissionDto,
  UpdateContactSubmissionStatusDto,
} from './dto/contact-submission.dto';
import { ContactSubmissionStatus, Prisma } from '@prisma/client';

@Injectable()
export class ContactSubmissionService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    status?: ContactSubmissionStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ContactSubmissionWhereInput = {};
    if (query?.status) where.status = query.status;
    if (query?.search?.trim()) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { email: { contains: query.search.trim(), mode: 'insensitive' } },
        { phone: { contains: query.search.trim(), mode: 'insensitive' } },
        { subject: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.contactSubmission.count({ where }),
      this.prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
    const submission = await this.prisma.contactSubmission.findUnique({
      where: { id },
    });
    if (!submission)
      throw new NotFoundException(
        `Contact submission with ID "${id}" not found.`,
      );
    return submission;
  }

  async create(dto: CreateContactSubmissionDto) {
    return this.prisma.contactSubmission.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        subject: dto.subject,
        message: dto.message,
        status: ContactSubmissionStatus.NEW,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateContactSubmissionStatusDto) {
    await this.findOne(id);
    return this.prisma.contactSubmission.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contactSubmission.delete({ where: { id } });
  }
}
