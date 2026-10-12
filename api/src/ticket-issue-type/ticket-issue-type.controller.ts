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
import { TicketIssueTypeService } from './ticket-issue-type.service';
import {
  CreateTicketIssueTypeDto,
  UpdateTicketIssueTypeDto,
} from './dto/ticket-issue-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ModuleName, PermissionAction, StaffStatus } from '@prisma/client';

@Controller('ticket-issue-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TicketIssueTypeController {
  constructor(
    private readonly ticketIssueTypeService: TicketIssueTypeService,
  ) {}

  @Public()
  @Get('active')
  findActive() {
    return this.ticketIssueTypeService.findActive();
  }

  @Get()
  @RequirePermission({ module: ModuleName.CMS, action: PermissionAction.READ })
  findAll(
    @Query('status') status?: StaffStatus,
    @Query('search') search?: string,
  ) {
    return this.ticketIssueTypeService.findAll({ status, search });
  }

  @Get(':id')
  @RequirePermission({ module: ModuleName.CMS, action: PermissionAction.READ })
  findOne(@Param('id') id: string) {
    return this.ticketIssueTypeService.findOne(id);
  }

  @Post()
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.CREATE,
  })
  create(@Body() createDto: CreateTicketIssueTypeDto) {
    return this.ticketIssueTypeService.create(createDto);
  }

  @Patch(':id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.UPDATE,
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateTicketIssueTypeDto) {
    return this.ticketIssueTypeService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.CMS,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.ticketIssueTypeService.remove(id);
  }
}
