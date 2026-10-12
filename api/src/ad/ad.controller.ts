import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  createMulterConfig,
  resolveUploadedFile,
} from '../common/upload/multer.config';
import { AdService } from './ad.service';
import { CreateAdDto, UpdateAdDto, TrackAdDto } from './dto/ad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  AdPlacement,
  ModuleName,
  PermissionAction,
  PromoAdStatus,
} from '@prisma/client';

@Controller('ads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Public()
  @Get('active')
  findActive(@Query('placement') placement?: AdPlacement) {
    return this.adService.findActive(placement);
  }

  @Get()
  @RequirePermission({ module: ModuleName.ADS, action: PermissionAction.READ })
  findAll(
    @Query('placement') placement?: AdPlacement,
    @Query('status') status?: PromoAdStatus,
    @Query('search') search?: string,
  ) {
    return this.adService.findAll({ placement, status, search });
  }

  @Get(':id')
  @RequirePermission({ module: ModuleName.ADS, action: PermissionAction.READ })
  findOne(@Param('id') id: string) {
    return this.adService.findOne(id);
  }

  @Post()
  @RequirePermission({
    module: ModuleName.ADS,
    action: PermissionAction.CREATE,
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
        { name: 'mobileThumbnail', maxCount: 1 },
      ],
      createMulterConfig('ads'),
    ),
  )
  async create(
    @Body() createAdDto: CreateAdDto,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
      mobileThumbnail?: Express.Multer.File[];
    },
  ) {
    if (files?.image?.[0])
      createAdDto.imageUrl =
        (await resolveUploadedFile(files.image[0], 'ads')) ||
        `/uploads/ads/${files.image[0].filename}`;
    if (files?.thumbnail?.[0])
      createAdDto.imageUrl =
        (await resolveUploadedFile(files.thumbnail[0], 'ads')) ||
        `/uploads/ads/${files.thumbnail[0].filename}`;
    if (files?.mobileThumbnail?.[0])
      createAdDto.mobileThumbnailUrl =
        (await resolveUploadedFile(files.mobileThumbnail[0], 'ads')) ||
        `/uploads/ads/${files.mobileThumbnail[0].filename}`;
    return this.adService.create(createAdDto);
  }

  @Patch(':id')
  @RequirePermission({
    module: ModuleName.ADS,
    action: PermissionAction.UPDATE,
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
        { name: 'mobileThumbnail', maxCount: 1 },
      ],
      createMulterConfig('ads'),
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() updateAdDto: UpdateAdDto,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
      mobileThumbnail?: Express.Multer.File[];
    },
  ) {
    if (files?.image?.[0])
      updateAdDto.imageUrl =
        (await resolveUploadedFile(files.image[0], 'ads')) ||
        `/uploads/ads/${files.image[0].filename}`;
    if (files?.thumbnail?.[0])
      updateAdDto.imageUrl =
        (await resolveUploadedFile(files.thumbnail[0], 'ads')) ||
        `/uploads/ads/${files.thumbnail[0].filename}`;
    if (files?.mobileThumbnail?.[0])
      updateAdDto.mobileThumbnailUrl =
        (await resolveUploadedFile(files.mobileThumbnail[0], 'ads')) ||
        `/uploads/ads/${files.mobileThumbnail[0].filename}`;
    return this.adService.update(id, updateAdDto);
  }

  @Public()
  @Patch(':id/track')
  track(@Param('id') id: string, @Body() trackAdDto: TrackAdDto) {
    return this.adService.track(id, trackAdDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.ADS,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.adService.remove(id);
  }
}
