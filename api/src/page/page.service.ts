import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto, UpdatePageDto } from './dto/page.dto';
import { ContentStatus, Prisma } from '@prisma/client';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class PageService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { status?: ContentStatus; search?: string }) {
    const where: Prisma.PageWhereInput = {};
    if (query?.status) where.status = query.status;
    if (query?.search?.trim()) {
      where.title = { contains: query.search.trim(), mode: 'insensitive' };
    }

    return this.prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: {
        slug,
        status: ContentStatus.PUBLISHED,
      },
    });

    if (!page) {
      // Check if page exists in draft or system
      const anyPage = await this.prisma.page.findUnique({ where: { slug } });
      if (anyPage) {
        return anyPage; // fallback to allow viewing
      }
      throw new NotFoundException(`Page with slug "${slug}" not found.`);
    }

    return page;
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    if (!page) throw new NotFoundException(`Page with ID "${id}" not found.`);
    return page;
  }

  async create(dto: CreatePageDto) {
    const baseSlug = dto.slug ? slugify(dto.slug) : slugify(dto.title);
    let finalSlug = baseSlug;
    let count = 1;
    while (await this.prisma.page.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count}`;
      count++;
    }

    return this.prisma.page.create({
      data: {
        title: dto.title,
        slug: finalSlug,
        content: dto.content,
        status: dto.status || ContentStatus.DRAFT,
        metaTitle: dto.metaTitle || null,
        metaDescription: dto.metaDescription || null,
        isSystem: dto.isSystem || false,
      },
    });
  }

  async update(id: string, dto: UpdatePageDto) {
    const page = await this.findOne(id);

    let finalSlug: string | undefined = undefined;
    if (dto.slug && dto.slug !== page.slug) {
      finalSlug = slugify(dto.slug);
      const existing = await this.prisma.page.findFirst({
        where: { slug: finalSlug, NOT: { id } },
      });
      if (existing)
        throw new ConflictException(`Slug "${finalSlug}" is already in use.`);
    }

    return this.prisma.page.update({
      where: { id },
      data: {
        title: dto.title,
        slug: finalSlug,
        content: dto.content,
        status: dto.status,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        isSystem: dto.isSystem,
      },
    });
  }

  async remove(id: string) {
    const page = await this.findOne(id);
    if (page.isSystem) {
      throw new ConflictException('System pages cannot be deleted.');
    }
    return this.prisma.page.delete({ where: { id } });
  }
}
