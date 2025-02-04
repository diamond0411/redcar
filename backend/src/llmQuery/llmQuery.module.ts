import { Module } from '@nestjs/common';
import { LLMQueryController } from './controllers/llmquery.controller';
import { LLMQueryService } from './services/llmquery.service';

@Module({
  controllers: [LLMQueryController],
  providers: [LLMQueryService],
})
export class LLMQueryModule {}