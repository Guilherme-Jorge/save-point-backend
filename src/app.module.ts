import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { OwnershipModule } from './ownership/ownership.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { ReviewModule } from './review/review.module';
// import { AchievementModule } from './achievement/achievement.module';
// import { DirectMessageModule } from './direct-message/direct-message.module';
// import { IgdbWebhookModule } from './webhooks/igdb/igdb-webhook.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, databaseConfig],
      isGlobal: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    UserModule,
    GameModule,
    OwnershipModule,
    WishlistModule,
    ReviewModule,
    // AchievementModule,
    // DirectMessageModule,
    // IgdbWebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
