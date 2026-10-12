import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddMenuBuilderItemsDto,
  CreateMenuItemDto,
  ReorderMenuBuilderDto,
  ReorderMenuItemsDto,
  UpdateMenuBuilderItemDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';
import { MenuType, Prisma, StaffStatus } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    menuType?: MenuType;
    status?: StaffStatus;
    search?: string;
  }) {
    const where: Prisma.MenuItemWhereInput = {};
    if (query?.menuType) where.menuType = query.menuType;
    if (query?.status) where.status = query.status;
    if (query?.search?.trim()) {
      where.label = { contains: query.search.trim(), mode: 'insensitive' };
    }

    return this.prisma.menuItem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findActiveByType(menuType?: MenuType) {
    if (!menuType || menuType === MenuType.HEADER) {
      const activeStructure = await this.prisma.menuStructureItem.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      if (activeStructure.length > 0) {
        return activeStructure.map((item) => ({
          id: item.id,
          label: item.navigationLabel,
          linkValue: item.urlSlug,
          navigationLabel: item.navigationLabel,
          urlSlug: item.urlSlug,
          titleAttribute: item.titleAttribute,
          openInNewTab: false,
          sortOrder: item.sortOrder,
          sourceType: item.sourceType,
          status: StaffStatus.ACTIVE,
        }));
      }
    }

    const where: Prisma.MenuItemWhereInput = {
      status: StaffStatus.ACTIVE,
    };
    if (menuType) where.menuType = menuType;

    return this.prisma.menuItem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item)
      throw new NotFoundException(`Menu item with ID "${id}" not found.`);
    return item;
  }

  async create(dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: {
        menuType: dto.menuType,
        label: dto.label,
        linkType: dto.linkType || 'CUSTOM',
        linkValue: dto.linkValue,
        openInNewTab: dto.openInNewTab || false,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : 0,
        status: dto.status || StaffStatus.ACTIVE,
      },
    });
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    await this.findOne(id);
    return this.prisma.menuItem.update({
      where: { id },
      data: {
        menuType: dto.menuType,
        label: dto.label,
        linkType: dto.linkType,
        linkValue: dto.linkValue,
        openInNewTab: dto.openInNewTab,
        sortOrder: dto.sortOrder,
        status: dto.status,
      },
    });
  }

  async reorder(dto: ReorderMenuItemsDto) {
    return this.prisma.$transaction(
      dto.menuItemIds.map((id, index) =>
        this.prisma.menuItem.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.menuItem.delete({ where: { id } });
  }

  // ============================= MEGA-MENU BUILDER =============================

  async getBuilderData() {
    const [pages, categories, activeItems, inactiveItems] = await Promise.all([
      this.prisma.page.findMany({
        select: { id: true, title: true, slug: true, isSystem: true },
        orderBy: { title: 'asc' },
      }),
      this.prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parent: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.menuStructureItem.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.menuStructureItem.findMany({
        where: { isActive: false },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const activePageIds = new Set(
      activeItems
        .filter((item) => item.sourceType === 'PAGE' && item.sourceId)
        .map((item) => item.sourceId),
    );
    const activePageSlugs = new Set(
      activeItems
        .filter((item) => item.sourceType === 'PAGE')
        .map((item) =>
          item.urlSlug.replace(/^\/pages\//, '').replace(/^\//, ''),
        ),
    );

    const pagesWithAdded = pages.map((p) => ({
      id: p.id,
      name: p.title,
      slug: p.slug,
      isSystem: p.isSystem,
      alreadyAdded: activePageIds.has(p.id) || activePageSlugs.has(p.slug),
    }));

    const categoriesWithParent = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentLabel: c.parent ? `${c.name} (${c.parent.name})` : c.name,
    }));

    return {
      pages: pagesWithAdded,
      categories: categoriesWithParent,
      activeItems,
      inactiveItems,
    };
  }

  async addBuilderItems(dto: AddMenuBuilderItemsDto) {
    const lastItem = await this.prisma.menuStructureItem.findFirst({
      orderBy: { sortOrder: 'desc' },
    });
    let nextSortOrder = (lastItem?.sortOrder ?? -1) + 1;

    const createdItems: any[] = [];

    if (dto.sourceType === 'PAGE') {
      const pageIds = dto.sourceIds || [];
      const pages = await this.prisma.page.findMany({
        where: { id: { in: pageIds } },
      });

      for (const page of pages) {
        const item = await this.prisma.menuStructureItem.create({
          data: {
            menuType: MenuType.HEADER,
            sourceType: 'PAGE',
            sourceId: page.id,
            urlSlug: `/pages/${page.slug}`,
            navigationLabel: page.title,
            sortOrder: nextSortOrder++,
            isActive: true,
          },
        });
        createdItems.push(item);
      }
    } else if (dto.sourceType === 'CATEGORY') {
      const categoryIds = dto.sourceIds || [];
      const categories = await this.prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      for (const cat of categories) {
        const item = await this.prisma.menuStructureItem.create({
          data: {
            menuType: MenuType.HEADER,
            sourceType: 'CATEGORY',
            sourceId: cat.id,
            urlSlug: `/category/${cat.slug}`,
            navigationLabel: cat.name,
            sortOrder: nextSortOrder++,
            isActive: true,
          },
        });
        createdItems.push(item);
      }
    } else if (dto.sourceType === 'CUSTOM') {
      if (!dto.label || !dto.url) {
        throw new BadRequestException(
          'Label and URL are required for custom link',
        );
      }

      const item = await this.prisma.menuStructureItem.create({
        data: {
          menuType: MenuType.HEADER,
          sourceType: 'CUSTOM',
          urlSlug: dto.url,
          navigationLabel: dto.label,
          sortOrder: nextSortOrder++,
          isActive: true,
        },
      });
      createdItems.push(item);
    }

    return createdItems;
  }

  async updateBuilderItem(id: string, dto: UpdateMenuBuilderItemDto) {
    const item = await this.prisma.menuStructureItem.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException(`MenuStructureItem ${id} not found`);

    return this.prisma.menuStructureItem.update({
      where: { id },
      data: {
        ...(dto.urlSlug !== undefined ? { urlSlug: dto.urlSlug } : {}),
        ...(dto.navigationLabel !== undefined
          ? { navigationLabel: dto.navigationLabel }
          : {}),
        ...(dto.titleAttribute !== undefined
          ? { titleAttribute: dto.titleAttribute }
          : {}),
      },
    });
  }

  async reorderBuilderItems(dto: ReorderMenuBuilderDto) {
    return this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.menuStructureItem.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  async removeBuilderItem(id: string) {
    const item = await this.prisma.menuStructureItem.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException(`MenuStructureItem ${id} not found`);

    return this.prisma.menuStructureItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async restoreBuilderItem(id: string) {
    const item = await this.prisma.menuStructureItem.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException(`MenuStructureItem ${id} not found`);

    return this.prisma.menuStructureItem.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deleteBuilderItem(id: string) {
    const item = await this.prisma.menuStructureItem.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException(`MenuStructureItem ${id} not found`);

    return this.prisma.menuStructureItem.delete({ where: { id } });
  }
}
