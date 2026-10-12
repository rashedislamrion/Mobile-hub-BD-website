import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { CreatePushNotificationDto } from './dto/push-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  ModuleName,
  NotificationTarget,
  PermissionAction,
} from '@prisma/client';

@Controller('push-notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PushNotificationController {
  constructor(
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Get()
  @RequirePermission({
    module: ModuleName.PUSH_NOTIFICATION,
    action: PermissionAction.READ,
  })
  findAll(
    @Query('targetAudience') targetAudience?: NotificationTarget,
    @Query('search') search?: string,
  ) {
    return this.pushNotificationService.findAll({ targetAudience, search });
  }

  @Get(':id')
  @RequirePermission({
    module: ModuleName.PUSH_NOTIFICATION,
    action: PermissionAction.READ,
  })
  findOne(@Param('id') id: string) {
    return this.pushNotificationService.findOne(id);
  }

  @Post()
  @RequirePermission({
    module: ModuleName.PUSH_NOTIFICATION,
    action: PermissionAction.CREATE,
  })
  create(@Body() createDto: CreatePushNotificationDto) {
    return this.pushNotificationService.create(createDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.PUSH_NOTIFICATION,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.pushNotificationService.remove(id);
  }
}
