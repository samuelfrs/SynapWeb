import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { SendMessageDto } from './dto/chat.dto';

@Controller('chat')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post(':jobId')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Param('jobId') jobId: string,
    @Body() dto: SendMessageDto,
    @Headers('x-gemini-key') customGeminiKey?: string,
  ) {
    return this.aiService.sendMessage(
      jobId,
      dto.message,
      dto.content,
      dto.history,
      customGeminiKey,
    );
  }

  @Get(':jobId/messages')
  async getMessages(@Param('jobId') jobId: string) {
    return this.aiService.getMessages(jobId);
  }
}
