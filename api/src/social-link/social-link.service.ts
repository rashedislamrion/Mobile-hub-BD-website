import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSocialLinkDto } from './dto/social-link.dto';
import { SocialPlatform, StaffStatus } from '@prisma/client';

@Injectable()
export class SocialLinkService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const platforms: SocialPlatform[] = [
      SocialPlatform.FACEBOOK,
      SocialPlatform.INSTAGRAM,
      SocialPlatform.YOUTUBE,
      SocialPlatform.TIKTOK,
      SocialPlatform.WHATSAPP,
      SocialPlatform.LINKEDIN,
    ];

    const links = await this.prisma.socialLink.findMany();
    const map = new Map(links.map((l) => [l.platform, l]));

    // Return populated list with defaults if missing
    return platforms.map((platform) => {
      if (map.has(platform)) return map.get(platform)!;
      return {
        id: `default-${platform}`,
        platform,
        url: `https://${platform.toLowerCase()}.com/mobilehubbd`,
        status: StaffStatus.ACTIVE,
      };
    });
  }

  async upsertPlatform(platform: SocialPlatform, dto: UpdateSocialLinkDto) {
    return this.prisma.socialLink.upsert({
      where: { platform },
      update: {
        url: dto.url,
        status: dto.status,
      },
      create: {
        platform,
        url: dto.url,
        status: dto.status || StaffStatus.ACTIVE,
      },
    });
  }
}
