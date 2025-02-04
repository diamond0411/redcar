import { Module } from '@nestjs/common';
import { LLMQueryModule } from "./llmQuery/llmQuery.module"
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true, envFilePath: '.env'}),LLMQueryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
