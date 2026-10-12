import { Module } from '@nestjs/common';
import { HelpNoteService } from './help-note.service';
import { HelpNoteController } from './help-note.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HelpNoteController],
  providers: [HelpNoteService],
  exports: [HelpNoteService],
})
export class HelpNoteModule {}
