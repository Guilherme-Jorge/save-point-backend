import { ConsoleLogger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./user/user.module";
import { GameModule } from "./game/game.module";
import { OwnershipModule } from "./ownership/ownership.module";
import { WishlistModule } from "./wishlist/wishlist.module";
import { ReviewModule } from "./review/review.module";
// import { AchievementModule } from "./achievement/achievement.module";
// import { DirectMessageModule } from "./direct-message/direct-message.module";
// import { IgdbWebhookModule } from "./webhooks/igdb/igdb-webhook.module";
import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import { APP_FILTER } from "@nestjs/core";
import { ExceptionFilterGlobal } from "./shared/filters/exception-filter-global";
import { SocialModule } from "./social/social.module";
import { GatewayModule } from "./gateway/gateway.module";
import { ChatModule } from "./chat/chat.module";
import { CoverMatcherModule } from "./cover-matcher/cover-matcher.module";
import { CustomListModule } from "./custom-list/custom-list.module";
import { ForumModule } from "./forum/forum.module";
import { RecommendationModule } from "./recommendation/recommendation.module";

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
    SocialModule,
    GatewayModule,
    ChatModule,
    CustomListModule,
    ForumModule,
    RecommendationModule,
    CoverMatcherModule,
    // AchievementModule,
    // DirectMessageModule,
    // IgdbWebhookModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionFilterGlobal,
    },
    ConsoleLogger,
    AppService,
  ],
})
export class AppModule {}
