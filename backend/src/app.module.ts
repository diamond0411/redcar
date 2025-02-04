import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LLMQueryModule } from "./llmQuery/llmQuery.module"
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true, envFilePath: '.env'}),LLMQueryModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}