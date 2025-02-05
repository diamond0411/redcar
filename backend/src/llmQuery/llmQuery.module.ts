import { Module } from '@nestjs/common';
import { LLMQueryController } from './controllers/llmquery.controller';
import { LLMQueryService } from './services/llmquery.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [LLMQueryController],
  providers: [LLMQueryService, JwtService],
})
export class LLMQueryModule {}