import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('units')
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.READ,
  })
  @Get()
  findAll() {
    return this.unitService.findAll();
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.READ,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitService.findOne(id);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.CREATE,
  })
  @Post()
  create(@Body() dto: CreateUnitDto) {
    return this.unitService.create(dto);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.UPDATE,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitService.update(id, dto);
  }

  @RequirePermission({
    module: ModuleName.PRODUCTS,
    action: PermissionAction.DELETE,
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unitService.remove(id);
  }
}
