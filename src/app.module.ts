import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
// import { GameModule } from './game/game.module';
// import { IgdbWebhookModule } from './webhooks/igdb/igdb-webhook.module';
import configuration from './config/configuration';
import databaseConfig from './config/database.config';
import databaseConfigProduction from './config/database.config.production';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration, databaseConfigProduction, databaseConfig],
      isGlobal: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory:
        process.env.NODE_ENV === 'production'
          ? databaseConfigProduction
          : databaseConfig,
    }),
    UserModule,
    // GameModule,
    // IgdbWebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
