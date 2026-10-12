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
import { HelpNoteService } from './help-note.service';
import { CreateHelpNoteDto, UpdateHelpNoteDto } from './dto/help-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('help-notes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class HelpNoteController {
  constructor(private readonly helpNoteService: HelpNoteService) {}

  @Get()
  @RequirePermission({
    module: ModuleName.HELP_NOTES,
    action: PermissionAction.READ,
  })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.helpNoteService.findAll({ search, page, limit });
  }

  @Get(':id')
  @RequirePermission({
    module: ModuleName.HELP_NOTES,
    action: PermissionAction.READ,
  })
  findOne(@Param('id') id: string) {
    return this.helpNoteService.findOne(id);
  }

  @Post()
  @RequirePermission({
    module: ModuleName.HELP_NOTES,
    action: PermissionAction.CREATE,
  })
  create(@Body() createDto: CreateHelpNoteDto) {
    return this.helpNoteService.create(createDto);
  }

  @Patch(':id')
  @RequirePermission({
    module: ModuleName.HELP_NOTES,
    action: PermissionAction.UPDATE,
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateHelpNoteDto) {
    return this.helpNoteService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission({
    module: ModuleName.HELP_NOTES,
    action: PermissionAction.DELETE,
  })
  remove(@Param('id') id: string) {
    return this.helpNoteService.remove(id);
  }
}
