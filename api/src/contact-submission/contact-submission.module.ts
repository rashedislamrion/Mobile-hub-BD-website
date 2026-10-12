import { Module } from '@nestjs/common';
import { ContactSubmissionService } from './contact-submission.service';
import { ContactSubmissionController } from './contact-submission.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContactSubmissionController],
  providers: [ContactSubmissionService],
  exports: [ContactSubmissionService],
})
export class ContactSubmissionModule {}
