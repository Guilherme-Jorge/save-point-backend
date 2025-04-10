import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, }),
    TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'db', // Use "db" when running on Docker, else use "localhost"
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'savepoint',
    entities: [__dirname + '**/*.entity{.ts,.js}'],
    synchronize: true,
  }),
  UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
