import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ModuleName, PermissionAction } from '@prisma/client';

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.READ,
  })
  @Get()
  findAll() {
    return this.branchService.findAll();
  }

  @Public()
  @Get('public')
  findPublic() {
    return this.branchService.findPublic();
  }

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.READ,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.CREATE,
  })
  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.branchService.create(dto);
  }

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.UPDATE,
    branchParam: 'id',
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchService.update(id, dto);
  }

  @RequirePermission({
    module: ModuleName.BRANCH,
    action: PermissionAction.DELETE,
    branchParam: 'id',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
