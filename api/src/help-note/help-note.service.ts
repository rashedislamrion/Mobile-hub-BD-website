import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHelpNoteDto, UpdateHelpNoteDto } from './dto/help-note.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class HelpNoteService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.HelpNoteWhereInput = {};
    if (query?.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { subject: { contains: term, mode: 'insensitive' } },
        { note: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.helpNote.count({ where }),
      this.prisma.helpNote.findMany({
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
    const note = await this.prisma.helpNote.findUnique({ where: { id } });
    if (!note)
      throw new NotFoundException(`Help note with ID "${id}" not found.`);
    return note;
  }

  async create(dto: CreateHelpNoteDto) {
    return this.prisma.helpNote.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        subject: dto.subject,
        note: dto.note || null,
      },
    });
  }

  async update(id: string, dto: UpdateHelpNoteDto) {
    await this.findOne(id);
    return this.prisma.helpNote.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        subject: dto.subject,
        note: dto.note,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.helpNote.delete({ where: { id } });
  }
}
