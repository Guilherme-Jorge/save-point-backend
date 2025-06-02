import {
    ArgumentsHost,
    Catch,
    ConsoleLogger,
    ExceptionFilter,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { HttpAdapterHost } from '@nestjs/core';
  
  @Catch()
  export class ExceptionFilterGlobal implements ExceptionFilter {
    constructor(
      private adapterHost: HttpAdapterHost,
      private nativeLogger: ConsoleLogger,
    ) {}
  
    catch(exception: unknown, host: ArgumentsHost) {
      this.nativeLogger.error(exception);
      console.error(exception);
  
      const { httpAdapter } = this.adapterHost;
  
      const context = host.switchToHttp();
      const response = context.getResponse();
      const request = context.getRequest();
      
      const { status, body } =
        exception instanceof HttpException
          ? {
              status: exception.getStatus(),
              body: exception.getResponse(),
            }
          : {
              status: HttpStatus.INTERNAL_SERVER_ERROR,
              body: {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                timestamp: new Date(new Date().getTime() - 3 * 60 * 60 * 1000 /** Applying time-zone */).toISOString(),
                path: httpAdapter.getRequestUrl(request),
              },
            };
  
      httpAdapter.reply(response, body, status);
    }
  }
  