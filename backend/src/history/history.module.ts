import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HistorySchema, History } from './entities/history.entity';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [MongooseModule.forFeature([{ name: History.name, schema:
    HistorySchema }])],
  controllers: [HistoryController],
  providers: [HistoryService, JwtService],
})
export class HistoryModule {}