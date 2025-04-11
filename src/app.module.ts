import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
// import { GameModule } from './game/game.module';
// import { IgdbWebhookModule } from './webhooks/igdb/igdb-webhook.module';
import configuration from './config/configuration';
import databaseConfig from './config/databaseConfig';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration, databaseConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('postgres.host') || 'db',
        port: config.get<number>('postgres.port') || 5432,
        username: config.get<string>('postgres.user') || 'postgres',
        password: config.get<string>('postgres.pwd') || 'postgres',
        database: config.get<string>('postgres.db') || 'savepoint',
        entities: [__dirname + '**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
    }),
    UserModule,
    // GameModule,
    // IgdbWebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
