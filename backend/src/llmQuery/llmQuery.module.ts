import { Module } from '@nestjs/common';
import { LLMQueryController } from './controllers/llmquery.controller';
import { LLMQueryService } from './services/llmquery.service';
import { JwtService } from '@nestjs/jwt';
import { HistorySchema, History } from 'src/history/entities/history.entity';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [MongooseModule.forFeature([{ name: History.name, schema:
    HistorySchema }])],
  controllers: [LLMQueryController],
  providers: [LLMQueryService, JwtService],
})
export class LLMQueryModule {}