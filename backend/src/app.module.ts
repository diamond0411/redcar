import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LLMQueryModule } from "./llmQuery/llmQuery.module"
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal: true, envFilePath: '.env'}),
    LLMQueryModule, 
    UserModule, 
    AuthModule,
    MongooseModule.forRoot(process.env.MONGO_URL+'/redcar')
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