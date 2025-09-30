import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { useContainer } from "class-validator";
import { IoAdapter } from "@nestjs/platform-socket.io";

export class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    options.cors = { origin: "*" };
    const server = super.createIOServer(port, options);
    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  // Passing the dependencies from AppModule to the Validators
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService);
  app.useWebSocketAdapter(new SocketIoAdapter(app));
  // app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(configService.get<number>("node.port") ?? 3000);
}
bootstrap();
