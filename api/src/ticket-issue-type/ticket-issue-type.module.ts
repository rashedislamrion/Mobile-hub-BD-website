import { Module } from '@nestjs/common';
import { TicketIssueTypeService } from './ticket-issue-type.service';
import { TicketIssueTypeController } from './ticket-issue-type.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TicketIssueTypeController],
  providers: [TicketIssueTypeService],
  exports: [TicketIssueTypeService],
})
export class TicketIssueTypeModule {}
