import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoverMatcherService } from './cover-matcher.service';

@Controller('cover-matcher')
export class CoverMatcherController {
  constructor(private readonly service: CoverMatcherService) {}

  @Post('search')
  @UseInterceptors(FileInterceptor('file'))
  async search(@UploadedFile() file: any): Promise<any> {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.service.searchCover(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      file!.buffer as Buffer,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (file!.originalname || 'image.jpg') as string,
    );
  }
}
