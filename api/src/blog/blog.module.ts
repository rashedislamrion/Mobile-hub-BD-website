import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogCategoryController } from './blog-category.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BlogController, BlogCategoryController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
