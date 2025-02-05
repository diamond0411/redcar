import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LLMQueryModule } from "./llmQuery/llmQuery.module"
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { HistoryModule } from './history/history.module';

const ENV = process.env.NODE_ENV;
@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, envFilePath: ENV ? '.env.dev' : `.env.${ENV}`}),
    LLMQueryModule, 
    UserModule, 
    AuthModule,
    MongooseModule.forRoot(process.env.MONGO_URL as string, {user: process.env.MONGO_AUTH_USER, pass: process.env.MONGO_AUTH_PASS}),
    HistoryModule,
  ],
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