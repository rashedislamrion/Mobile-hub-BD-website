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
} from '@nestjs/common';
import { ContactSubmissionService } from './contact-submission.service';
import {
  CreateContactSubmissionDto,
  UpdateContactSubmissionStatusDto,
} from './dto/contact-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  ContactSubmissionStatus,
  ModuleName,
  PermissionAction,
} from '@prisma/client';

@Controller('contact-submissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContactSubmissionController {
  constructor(
    private readonly contactSubmissionService: ContactSubmissionService,
  ) {}

  @Public()
  @Post()
  create(@Body() createDto: CreateContactSubmissionDto) {
    return this.contactSubmissionService.create(createDto);
  }

  @Get()
  @RequirePermission({ module: ModuleName.CMS, action: PermissionAction.READ })
  findAll(
    @Query('status') status?: ContactSubmissionStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contactSubmissionService.findAll({
      status,
      search,
      page,
      limit,
    });
  }

  @Get(':id')
  @RequirePermission({ module: ModuleName.CMS, action: PermissionAction.READ })
  findOne(@Param('id') id: string) {
    return this.contactSubmissionService.findOne(id);
  }

  @Patch(':id/status')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateContactSubmissionStatusDto,
  ) {
    return this.contactSubmissionService.updateStatus(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.contactSubmissionService.remove(id);
  }
}
